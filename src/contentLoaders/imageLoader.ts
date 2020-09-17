// Adapted from https://github.com/mrdoob/three.js/blob/dev/src/loaders/ImageLoader.js

import { LoadingManager } from "./loadingmanager.js";
import { Cache } from "./cache.js";
import { BaseLoader } from "./baseLoader.js";

/**
 * Image loader
 */
export class ImageLoader extends BaseLoader {
    public constructor(manager: LoadingManager) {
        super(manager);
    }

    /**
     * load image, with callbacks
     * @param url 
     * @param onImgLoad 
     * @param onProgress 
     * @param onError 
     */
    public load(url: string, 
        onImgLoad?:(image: HTMLImageElement)=>void,
        onProgress?:(event: ProgressEvent)=>void,
        onError?:(event: ErrorEvent)=>void): HTMLImageElement
    {
        if (this.path !== undefined) { url = this.path + url; }
        url = this.manager.resolveURL(url);

        let cached = Cache.get(url);
        if (cached !== undefined) {
            this.manager.itemStart(url);

            setTimeout(() => {
                if (onImgLoad !== undefined) {
                    onImgLoad(cached);
                }
                this.manager.itemEnd(url);
            }, 0);
            return cached;
        }

        const image = document.createElementNS('http://www.w3.org/1999/xhtml', 'img') as HTMLImageElement;
        const self = this;

        function onImageLoad() {
            image.removeEventListener('load', onImageLoad, false);
            image.removeEventListener('error', onImageError, false);

            Cache.add(url, image);

            if (onImgLoad) {
                onImgLoad(image);
            }
            self.manager.itemEnd(url);
        }

        function onImageError(event: ErrorEvent) {
            image.removeEventListener('load', onImageLoad, false);
            image.removeEventListener('error', onImageError, false);

            if(onError) onError(event);

            self.manager.itemError(url);
            self.manager.itemEnd(url);
        }

        image.addEventListener('load', onImageLoad, false);
        image.addEventListener('error', onImageError, false);

        if ( url.substr( 0, 5 ) !== 'data:' ) {

			if ( this.crossOrigin !== undefined ) image.crossOrigin = this.crossOrigin;

        }
        
        self.manager.itemStart(url);
        image.src = url;
        return image;
    }

    /**
     * load image, returns a promise
     * @param url 
     */
    public loadPromise(url: string): Promise<HTMLImageElement | ImageData> {
        if (this.path !== undefined) { url = this.path + url; }
        url = this.manager.resolveURL(url);

        let cached = Cache.get(url);
        if (cached !== undefined) {
            // is this necessary?
            this.manager.itemStart(url);
            setTimeout(() => {
                this.manager.itemEnd(url);
            }, 0);
            return Promise.resolve(cached);
        }

        return new Promise((resolve, reject) => {
            if (url.search( /\.hdr($|\?)/i ) > 0) {
                // todo: load hdr format image
                const self = this;
                const xhr = new XMLHttpRequest();
                xhr.responseType = "arraybuffer";
                xhr.onerror = function(event) {
                    self.manager.itemError(url);
                    self.manager.itemEnd(url);
                    reject(event);
                };
                xhr.onload = function (ev) {

                    // todo: create Uint8ClampedArray
                    if (this.status >= 400) reject(this.status);
                    let header: string = '';
                    let pos: number = 0;
                    let d8 = new Uint8Array(this.response);
                    let format: string | null = null;
                    // read header.  
                    while (!header.match(/\n\n[^\n]+\n/g)) header += String.fromCharCode(d8[pos++]);
                    // check format. 
                    let headerMatch = header.match(/FORMAT=(.*)$/m);
                    if (headerMatch !== null) {
                        format = headerMatch[1];
                    }
                    if (format != '32-bit_rle_rgbe') {
                        let errorInfo = 'unknown HDR format : ' + format;
                        console.warn(errorInfo);
                        reject(errorInfo);
                        return;
                    }
                    // parse resolution
                    var rez = header.split(/\n/).reverse()[1].split(' ');
                    const width: number = Number(rez[3]) * 1;
                    const height: number = Number(rez[1]) * 1;
                    // Create image.
                    var img = new Uint8ClampedArray(width * height * 4);
                    var ipos = 0;
                    // Read all scanlines
                    for (var j = 0; j < height; j++) {
                        var rgbe = d8.slice(pos, pos += 4), scanline = [];
                        if (rgbe[0] != 2 || (rgbe[1] != 2) || (rgbe[2] & 0x80)) {
                            var len = width, rs = 0;
                            pos -= 4;
                            while (len > 0) {
                                img.set(d8.slice(pos, pos += 4), ipos);
                                if (img[ipos] == 1 && img[ipos + 1] == 1 && img[ipos + 2] == 1) {
                                    for (let i = img[ipos + 3] << rs; i > 0; i--) {
                                        img.set(img.slice(ipos - 4, ipos), ipos);
                                        ipos += 4;
                                        len--;
                                    }
                                    rs += 8;
                                } else {
                                    len--; ipos += 4; rs = 0;
                                }
                            }
                        } else {
                            if ((rgbe[2] << 8) + rgbe[3] != width) {
                                reject("HDR line mismatch ..");
                                return;
                            }
                            for (var i = 0; i < 4; i++) {
                                var ptr = i * width, ptr_end = (i + 1) * width, buf, count;
                                while (ptr < ptr_end) {
                                    buf = d8.slice(pos, pos += 2);
                                    if (buf[0] > 128) { count = buf[0] - 128; while (count-- > 0) scanline[ptr++] = buf[1]; }
                                    else { count = buf[0] - 1; scanline[ptr++] = buf[1]; while (count-- > 0) scanline[ptr++] = d8[pos++]; }
                                }
                            }
                            for (var i = 0; i < width; i++) { img[ipos++] = scanline[i]; img[ipos++] = scanline[i + width]; img[ipos++] = scanline[i + 2 * width]; img[ipos++] = scanline[i + 3 * width]; }
                        }
                    }

                    const image = new ImageData(img, width, height);

                    Cache.add(url, image);
                    self.manager.itemEnd(url);
                    resolve(image);
                }

                self.manager.itemStart(url);
                xhr.open("GET", url, true);
                xhr.send(null);

            } else {
                const image = document.createElementNS('http://www.w3.org/1999/xhtml', 'img') as HTMLImageElement;
                const self = this;
        
                function onImageLoad() {
                    image.removeEventListener('load', onImageLoad, false);
                    image.removeEventListener('error', onImageError, false);
        
                    Cache.add(url, image);
                    self.manager.itemEnd(url);
                    resolve(image);
                }
        
                function onImageError(event: ErrorEvent) {
                    image.removeEventListener('load', onImageLoad, false);
                    image.removeEventListener('error', onImageError, false);
        
                    self.manager.itemError(url);
                    self.manager.itemEnd(url);
                    reject(event);
                }
        
                image.addEventListener('load', onImageLoad, false);
                image.addEventListener('error', onImageError, false);
        
                if ( url.substr( 0, 5 ) !== 'data:' ) {
        
                    if ( this.crossOrigin !== undefined ) image.crossOrigin = this.crossOrigin;
        
                }
                
                self.manager.itemStart(url);
                image.src = url;        // this will start request from server
            }
        });
    }
}
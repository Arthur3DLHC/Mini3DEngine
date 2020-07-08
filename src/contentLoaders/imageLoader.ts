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
}
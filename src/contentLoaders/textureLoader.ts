// Adapted from https://github.com/mrdoob/three.js/blob/dev/src/loaders/TextureLoader.js

import { LoadingManager } from "./loadingmanager.js";
import { BaseLoader } from "./baseLoader.js";
import { Texture } from "../WebGLResources/textures/texture.js";
import { ImageLoader } from "./imageLoader.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { SamplerState } from "../WebGLResources/renderStates/samplerState.js";
import { Cache } from "./cache.js";
import { TextureCache } from "../WebGLResources/textureCache.js";
import { Texture2D } from "../mini3DEngine.js";

export class TextureLoader extends BaseLoader {
    public constructor(manager: LoadingManager) {
        super(manager);
    }

    /**
     * load texture from url, call callback function when loaded
     * @param url 
     * @param onTexLoad 
     * @param onProgress 
     * @param onError 
     */
    public load(url: string, onTexLoad?: ( texture: Texture ) => void,
    onProgress?: ( event: ProgressEvent ) => void,
    onError?: ( event: ErrorEvent ) => void): Texture | undefined {
        const texKey = "tex:" + url;
        let cached = TextureCache.instance.get(texKey);
        if (cached !== undefined) {
            this.manager.itemStart(texKey);
            setTimeout(()=>{
                if (onTexLoad !== undefined) {
                    if (cached !== undefined) {
                        onTexLoad(cached);
                    }
                }
                this.manager.itemEnd(texKey);
            }, 0);
            return cached;
        }

        const texture = new Texture2D();
        const loader = new ImageLoader(this.manager);

        loader.crossOrigin = this.crossOrigin;
        loader.path = this.path;

        loader.load(url, (image)=>{
            texture.image = image;
            texture.width = image.width;
            texture.height = image.height;
            texture.depth = 1;
            texture.mipLevels = 1024;
            const isJPEG = url.search( /\.jpe?g($|\?)/i ) > 0 || url.search( /^data\:image\/jpeg/ ) === 0;
            if (isJPEG) {
                texture.format = GLDevice.gl.RGB;
            } else {
                texture.format = GLDevice.gl.RGBA;
            }
            texture.componentType = GLDevice.gl.UNSIGNED_BYTE;
            texture.samplerState = new SamplerState(GLDevice.gl.REPEAT, GLDevice.gl.REPEAT, GLDevice.gl.LINEAR_MIPMAP_LINEAR, GLDevice.gl.LINEAR);
            texture.cached = true;
            // upload to vidmem now? or add a 'needUpdate' flag and upload in render loop?
            texture.upload();
            TextureCache.instance.add(texKey, texture);

            if (onTexLoad !== undefined) {
                onTexLoad(texture);
            }
            
        }, onProgress, onError);

        return texture;
    }

    /**
     * load texture, return promise
     * @param url 
     */
    public loadPromise(url: string): Promise<Texture> {
        const texKey = "tex:" + url;
        let cached = TextureCache.instance.get(texKey);
        if (cached !== undefined) {
            this.manager.itemStart(texKey);
            setTimeout(()=>{
                this.manager.itemEnd(texKey);
            }, 0);
            return Promise.resolve(cached);
        }

        const promise: Promise<Texture> = new Promise((resolve, reject) => {
            const loader = new ImageLoader(this.manager);

            loader.crossOrigin = this.crossOrigin;
            loader.path = this.path;

            loader.loadPromise(url).then((image) => {
                const texture = new Texture2D();
                texture.image = image;
                texture.width = image.width;
                texture.height = image.height;
                texture.depth = 1;
                texture.mipLevels = 1024;
                const isHDR = url.search(/\.hdr($|\?)/i) > 0;
                if(isHDR) {

                } else {
                    const isJPEG = url.search( /\.jpe?g($|\?)/i ) > 0 || url.search( /^data\:image\/jpeg/ ) === 0;
                    if (isJPEG) {
                        texture.format = GLDevice.gl.RGB;
                    } else {
                        texture.format = GLDevice.gl.RGBA;
                    }
                }
                texture.isHDR = isHDR;
                texture.componentType = GLDevice.gl.UNSIGNED_BYTE;
                texture.samplerState = new SamplerState(GLDevice.gl.REPEAT, GLDevice.gl.REPEAT, GLDevice.gl.LINEAR_MIPMAP_LINEAR, GLDevice.gl.LINEAR_MIPMAP_LINEAR);
                texture.cached = true;
                texture.upload();
                TextureCache.instance.add(texKey, texture);

                resolve(texture);
            }).catch((reason) => {
                reject(reason);
            });
        });
        return promise;
    }
}
// Adapted from https://github.com/mrdoob/three.js/blob/dev/src/loaders/TextureLoader.js

import { LoadingManager } from "./loadingmanager.js";
import { BaseLoader } from "./baseLoader.js";
import { Texture2D } from "../WebGLResources/textures/texture2D.js";
import { ImageLoader } from "./imageLoader.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { SamplerState } from "../WebGLResources/renderStates/samplerState.js";

export class TextureLoader extends BaseLoader {
    public constructor(manager: LoadingManager) {
        super(manager);
    }

    // load texture from url, call callback function when loaded
    public load(url: string, onTexLoad?: ( texture: Texture2D ) => void,
    onProgress?: ( event: ProgressEvent ) => void,
    onError?: ( event: ErrorEvent ) => void): Texture2D {
        // todo: check cache?

        const texture = new Texture2D();
        const loader = new ImageLoader(this.manager);

        loader.crossOrigin = this.crossOrigin;
        loader.path = this.path;

        loader.load(url, (image)=>{
            texture.image = image;
            // todo: width, height, depth, mips, format...
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
            texture.samplerState = new SamplerState(GLDevice.gl.REPEAT, GLDevice.gl.REPEAT, GLDevice.gl.LINEAR_MIPMAP_LINEAR, GLDevice.gl.LINEAR_MIPMAP_LINEAR);
            // todo: texture cache?
            texture.cached = true;
            // upload to vidmem now? or add a 'needUpdate' flag and upload in render loop?
            texture.upload();

            if (onTexLoad !== undefined) {
                onTexLoad(texture);
            }
            
        }, onProgress, onError);

        return texture;
    }
}
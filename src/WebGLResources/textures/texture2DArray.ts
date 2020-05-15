import { Texture } from "./texture.js";
import { GLDevice } from "../glDevice.js";

export class Texture2DArray extends Texture {
    public constructor() {
        super();
    }

    public get target(): GLenum {
        return GLDevice.gl.TEXTURE_2D_ARRAY;
    }

    /**
     * get the proper sampler type for this texture
     */
    public get samplerType(): GLenum {
        if (this.format === GLDevice.gl.DEPTH_COMPONENT || this.format === GLDevice.gl.DEPTH_STENCIL) {
            return GLDevice.gl.SAMPLER_2D_ARRAY_SHADOW;
        } else {
            return GLDevice.gl.SAMPLER_2D_ARRAY;
        }
    }

    // todo: source, could be a html image element?
    // 用一个长图的形式？

    public create() {
        // create gl texture
        // initialize tex by gl.TexImage2D
        throw new Error("Not implemented.");
    }
    
    public upload() {
        throw new Error("Not implemented.");
    }
}
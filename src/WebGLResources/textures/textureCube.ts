import { Texture } from "./texture.js";
import { GLDevice } from "../glDevice.js";

export class Texture3D extends Texture {
    public constructor() {
        super();
    }

    public get target(): GLenum {
        return GLDevice.gl.TEXTURE_CUBE_MAP;
    }

    /**
     * get the proper sampler type for this texture
     */
    public get samplerType(): GLenum {
        // depth textures should use shadow sampler
        if (this.format === GLDevice.gl.DEPTH || this.format === GLDevice.gl.DEPTH_STENCIL) {
            return GLDevice.gl.SAMPLER_CUBE_SHADOW;
        } else {
            return GLDevice.gl.SAMPLER_CUBE;
        }
    }

    // todo: source，长图的形式？

    public create() {
        // create gl texture
        // initialize tex by gl.TexImageCube
        throw new Error("Not implemented.");
    }
    public upload() {
        throw new Error("Not implemented.");
    }
}
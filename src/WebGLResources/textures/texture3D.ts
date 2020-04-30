import { Texture } from "./texture.js";
import { GLDevice } from "../glDevice.js";

export class Texture3D extends Texture {
    public constructor() {
        super();
    }

    public get target(): GLenum {
        return GLDevice.gl.TEXTURE_3D;
    }

    /**
     * get the proper sampler type for this texture
     */
    public get samplerType(): GLenum {
        return GLDevice.gl.SAMPLER_3D;
    }

    // TODO: source，用一个长图的形式？
    // 如果是程序中生成的，则需要提供设置每个像素颜色的接口？
    // 用于生成 Irradiance volume 时；
    // 或者支持作为渲染目标？
    public create() {
        // create gl texture
        // initialize tex by gl.TexImage3D
        throw new Error("Not implemented.");
    }

    public upload() {
        throw new Error("Not implemented.");
    }
}
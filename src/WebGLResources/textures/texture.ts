import { GLDevice } from "../glDevice.js";
import { DataArray } from "../dataArray.js";
import { SamplerState } from "../renderStates/samplerState.js";

/**
 * Base class for textures
 */
export class Texture {
    public constructor() {
        this.glTexture = null;
        this.image = null;
        this.width = 0;
        this.height = 0;
        this.depth = 0;
        this.format = GLDevice.gl.RGBA;
        this.componentType = GLDevice.gl.UNSIGNED_BYTE;
        this.samplerState = null;
        this.cached = false;
    }
    // todo: 源图片或数据？是否放在基类中？
    // 是否使用一个多类型成员？
    public image: HTMLImageElement | HTMLCanvasElement | ImageData | DataArray | null;

    public glTexture: WebGLTexture | null;

    /**
     * get the proper target for this texture
     */
    public get target(): GLenum {
        return GLDevice.gl.TEXTURE_2D;
    }

    /**
     * get the proper sampler type for this texture
     */
    public get samplerType(): GLenum {
        return GLDevice.gl.SAMPLER_2D;
    }

    public width: number;
    public height: number;
    public depth: number;

    public format: GLenum;
    public componentType: GLenum;

    /**
     * default sampler state? or put sampler state to material?
     * 注意：如果是shadowmap，则不要使用 samplerState
     */
    public samplerState: SamplerState | null;

    /**
     * if texture is in cache, must set to true
     */
    public cached: boolean;

    public create() {
        // create gl texture
        // initialize tex by gl.TexImage2D
    }

    public upload() {
        // base class do nothing.
        // subclass upload texture data to gl texture according to their types.

        // generate mipmaps now?
    }

    public release() {
        if (this.cached) {
            return;
        }
        if (this.glTexture) {
            GLDevice.gl.deleteTexture(this.glTexture);
            this.glTexture = null;
        }
    }
}
import { GLDevice } from "../glDevice.js";
import { DataArray } from "../dataArray.js";
import { SamplerState } from "../renderStates/samplerState.js";
import vec3 from "../../../lib/tsm/vec3.js";

/**
 * Base class for textures
 */
export class Texture {
    public constructor(width: number = 0, height: number = 0, depth: number = 1, mipLevels: number = 1, format: GLenum = GLDevice.gl.RGBA, compType: GLenum = GLDevice.gl.UNSIGNED_BYTE) {
        this.glTexture = null;
        this.image = null;
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.mipLevels = mipLevels;
        this.format = format;
        this.componentType = compType;
        this.isHDR = false;
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

    public mipLevels: number;

    public format: GLenum;
    public componentType: GLenum;

    public isHDR: boolean;

    /**
     * default sampler state? or put sampler state to material?
     * 注意：如果是shadowmap，则不要使用 samplerState
     */
    public samplerState: SamplerState | null;

    /**
     * if texture is in cache, must set to true
     */
    public cached: boolean;

    /**
     * get width, height, depth of a mipmap level
     * @param level mipmap level
     */
    public getLevelSize(level: number): vec3 {
        let w = this.width;
        let h = this.height;
        let d = this.depth
        for(let i = 0; i < level; i++) {
            w = w / 2;
            h = h / 2;
            d = d / 2;
        }
        return new vec3([w, h, d]);
    }

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
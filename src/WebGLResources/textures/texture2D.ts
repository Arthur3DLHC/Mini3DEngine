import { Texture } from "./texture.js";
import { GLDevice } from "../glDevice.js";
import { GLTextures } from "../glTextures.js";
import vec3 from "../../../lib/tsm/vec3.js";

export class Texture2D extends Texture {
    public constructor() {
        super();
        this.isShadowMap = false;
    }

    /**
     * is used as shadow map in shaders
     */
    public isShadowMap: boolean;

    public get target(): GLenum {
        return GLDevice.gl.TEXTURE_2D;
    }

    /**
     * get the proper sampler type for this texture
     */
    public get samplerType(): GLenum {
        // depth textures should use shadow sampler
        if ((this.format === GLDevice.gl.DEPTH_COMPONENT || this.format === GLDevice.gl.DEPTH_STENCIL) && this.isShadowMap) {
            return GLDevice.gl.SAMPLER_2D_SHADOW;
        } else {
            return GLDevice.gl.SAMPLER_2D;
        }
    }

    // todo: image source, culd be html image element
    // todo: 可以作为渲染目标；
    public create() {
        // create gl texture
        if (this.glTexture) {
            throw new Error("Already created.");
        }
        const gl = GLDevice.gl;
        this.glTexture = gl.createTexture();

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.glTexture);

        // initialize tex by gl.TexImage2D
        const internalFmt = GLTextures.internalFormatFrom(this.format, this.componentType);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFmt, this.width, this.height, 0, this.format, this.componentType, null);

        if (this.format === gl.DEPTH_COMPONENT || this.format === gl.DEPTH_STENCIL && this.isShadowMap) {
            // enable texture compare, so sampler2DShadow can work
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);  // PCF shadow
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.ALWAYS);
            // set sampler state
            // 设置一次后，会记录在纹理对象中；下次修改之前，只要绑定了此纹理，自动应用它记录的 sampler state
            if (this.samplerState) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.samplerState.minFilter);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.samplerState.magFilter);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.samplerState.wrapS);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.samplerState.wrapT);
            } else {
                // default for frame buffer objects
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }
        }

        // anisotropy not supported by webgl?
        // gl.texParameteri(gl.TEXTURE_2D, gl.texture_max_)
        if (this.mipLevels > 1) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    public upload() {
        // todo: 检查 image source 是否合法

        if (!this.glTexture) {
            this.glTexture = GLDevice.gl.createTexture();
        }
        GLDevice.gl.bindTexture(GLDevice.gl.TEXTURE_2D, this.glTexture);

        // TODO: 向贴图中提交数据

        // initialize tex by gl.TexImage2D
        GLDevice.gl.bindTexture(GLDevice.gl.TEXTURE_2D, null);
        throw new Error("Not implemented.");
    }
}
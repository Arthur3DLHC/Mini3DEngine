import { Texture } from "./texture.js";
import { GLDevice } from "../glDevice.js";
import { GLTextures } from "../glTextures.js";

export class Texture2D extends Texture {
    public constructor() {
        super();
        this.isShadowMap = false;
    }

    /**
     * is used as shadow map in the shader
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
        this.glTexture = GLDevice.gl.createTexture();

        GLDevice.gl.activeTexture(GLDevice.gl.TEXTURE0);
        GLDevice.gl.bindTexture(GLDevice.gl.TEXTURE_2D, this.glTexture);

        // initialize tex by gl.TexImage2D
        const internalFmt = GLTextures.internalFormatFrom(this.format, this.componentType);
        GLDevice.gl.texImage2D(GLDevice.gl.TEXTURE_2D, 0, internalFmt, this.width, this.height, 0, this.format, this.componentType, null);

        if (this.format === GLDevice.gl.DEPTH_COMPONENT || this.format === GLDevice.gl.DEPTH_STENCIL) {
            // enable texture compare, so sampler2DShadow can work
            GLDevice.gl.texParameteri(GLDevice.gl.TEXTURE_2D, GLDevice.gl.TEXTURE_COMPARE_MODE, GLDevice.gl.COMPARE_REF_TO_TEXTURE);
            GLDevice.gl.texParameteri(GLDevice.gl.TEXTURE_2D, GLDevice.gl.TEXTURE_COMPARE_FUNC, GLDevice.gl.LEQUAL);
        } else {
            GLDevice.gl.texParameteri(GLDevice.gl.TEXTURE_2D, GLDevice.gl.TEXTURE_COMPARE_MODE, GLDevice.gl.NONE);
            GLDevice.gl.texParameteri(GLDevice.gl.TEXTURE_2D, GLDevice.gl.TEXTURE_COMPARE_FUNC, GLDevice.gl.ALWAYS);
            // set sampler state
            // 设置一次后，会记录在纹理对象中；下次修改之前，只要绑定了此纹理，自动应用它记录的 sampler state
            if (this.samplerState) {
                GLDevice.gl.texParameteri(GLDevice.gl.TEXTURE_2D, GLDevice.gl.TEXTURE_MIN_FILTER, this.samplerState.minFilter);
                GLDevice.gl.texParameteri(GLDevice.gl.TEXTURE_2D, GLDevice.gl.TEXTURE_MAG_FILTER, this.samplerState.magFilter);
                GLDevice.gl.texParameteri(GLDevice.gl.TEXTURE_2D, GLDevice.gl.TEXTURE_WRAP_S, this.samplerState.wrapS);
                GLDevice.gl.texParameteri(GLDevice.gl.TEXTURE_2D, GLDevice.gl.TEXTURE_WRAP_T, this.samplerState.wrapT);
            } else {
                // default for frame buffer objects
                GLDevice.gl.texParameteri(GLDevice.gl.TEXTURE_2D, GLDevice.gl.TEXTURE_MIN_FILTER, GLDevice.gl.NEAREST);
                GLDevice.gl.texParameteri(GLDevice.gl.TEXTURE_2D, GLDevice.gl.TEXTURE_MAG_FILTER, GLDevice.gl.NEAREST);
                GLDevice.gl.texParameteri(GLDevice.gl.TEXTURE_2D, GLDevice.gl.TEXTURE_WRAP_S, GLDevice.gl.CLAMP_TO_EDGE);
                GLDevice.gl.texParameteri(GLDevice.gl.TEXTURE_2D, GLDevice.gl.TEXTURE_WRAP_T, GLDevice.gl.CLAMP_TO_EDGE);
            }
        }

        // anisotropy not supported by webgl?
        // GLDevice.gl.texParameteri(GLDevice.gl.TEXTURE_2D, GLDevice.gl.texture_max_)

        GLDevice.gl.bindTexture(GLDevice.gl.TEXTURE_2D, null);
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
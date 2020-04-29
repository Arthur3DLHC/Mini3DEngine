import { GLDevice } from "./glDevice.js";
import { Texture } from "./textures/texture.js";

export class GLTextures {
    /**
     * 
     * @param format 
     * @param type 
     */
    public static internalFormatFrom(format: GLenum, type: GLenum) : GLenum {
        let internalFormat = format;
        switch (format) {
            case GLDevice.gl.RED:
                if (type === GLDevice.gl.FLOAT) internalFormat = GLDevice.gl.R32F;
                if (type === GLDevice.gl.HALF_FLOAT) internalFormat = GLDevice.gl.R16F;
                if (type === GLDevice.gl.UNSIGNED_BYTE) internalFormat = GLDevice.gl.R8;
                break;
            case GLDevice.gl.RGB:
                if (type === GLDevice.gl.FLOAT) internalFormat = GLDevice.gl.RGB32F;
                if (type === GLDevice.gl.HALF_FLOAT) internalFormat = GLDevice.gl.RGB16F;
                if (type === GLDevice.gl.UNSIGNED_BYTE) internalFormat = GLDevice.gl.RGB8;
                break;
            case GLDevice.gl.RGBA:
                if (type === GLDevice.gl.FLOAT) internalFormat = GLDevice.gl.RGBA32F;
                if (type === GLDevice.gl.HALF_FLOAT) internalFormat = GLDevice.gl.RGBA16F;
                if (type === GLDevice.gl.UNSIGNED_BYTE) internalFormat = GLDevice.gl.RGBA8;
                break;
            case GLDevice.gl.DEPTH:
                internalFormat = GLDevice.gl.DEPTH_COMPONENT24;
                break;
            case GLDevice.gl.DEPTH_STENCIL:
                internalFormat = GLDevice.gl.DEPTH24_STENCIL8;
                break;
            default:
                throw new Error("Format not supported:" + format + " type: " + type);
                break;
        }

        return internalFormat;
    }

    // TODO: 设置绘制使用的纹理
    public static setTextureAt(unit: number, texture: Texture | null) {
        GLDevice.gl.activeTexture(unit);
        throw new Error("Not implemented");
    }
}
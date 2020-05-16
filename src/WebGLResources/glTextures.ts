import { GLDevice } from "./glDevice.js";
import { Texture } from "./textures/texture.js";
import { Texture2D } from "./textures/texture2D.js";

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
            case GLDevice.gl.DEPTH_COMPONENT:
                if (type === GLDevice.gl.UNSIGNED_SHORT) {
                    internalFormat = GLDevice.gl.DEPTH_COMPONENT16;
                } else {
                    internalFormat = GLDevice.gl.DEPTH_COMPONENT24;
                }
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

    /**
     * get unit number used by gl.uniform1i(samplerLocation, unitNumber)
     * @param unit gl.Texture*
     */
    private static glUnitFrom(unit: number): GLenum {
        return unit + GLDevice.gl.TEXTURE0;
    }

    // TODO: 设置绘制使用的纹理
    public static setTextureAt(unit: number, texture: Texture | null, target: GLenum = GLDevice.gl.TEXTURE_2D) {
        // fix me: optimize
        // 是否记录一下当前的所有unit的纹理对象，只有不同时才调用gl.bindTexture？
        GLDevice.gl.activeTexture(GLTextures.glUnitFrom(unit));
        if (texture) {
            // todo: 2d or 3d or cube or array
            GLDevice.gl.bindTexture(texture.target, texture.glTexture);
        } else {
            GLDevice.gl.bindTexture(target, null);
        }
    }

    public static setStartUnit(start: number) {
        GLTextures._curUnitNumber = start;
    }

    public static queryUnit(): number {
        const unit = GLTextures._curUnitNumber;
        GLTextures._curUnitNumber++;
        // todo: 判断是否大于 max texture units了
        return unit;
    }

    private static _curUnitNumber: number = 0;
}
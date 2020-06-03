import { GLDevice } from "./glDevice.js";
import { Texture } from "./textures/texture.js";
import { Texture2D } from "./textures/texture2D.js";

export class GLTextures {
    public static textures: (Texture|null)[] = [];
    /**
     * 
     * @param format 
     * @param type 
     */
    public static internalFormatFrom(format: GLenum, type: GLenum) : GLenum {
        const gl = GLDevice.gl;
        let internalFormat = format;
        switch (format) {
            case gl.RED:
                if (type === gl.FLOAT) internalFormat = gl.R32F;
                if (type === gl.HALF_FLOAT) internalFormat = gl.R16F;
                if (type === gl.UNSIGNED_BYTE) internalFormat = gl.R8;
                break;
            case gl.RGB:
                if (type === gl.FLOAT) internalFormat = gl.RGB32F;
                if (type === gl.HALF_FLOAT) internalFormat = gl.RGB16F;
                if (type === gl.UNSIGNED_BYTE) internalFormat = gl.RGB8;
                break;
            case gl.RGBA:
                if (type === gl.FLOAT) internalFormat = gl.RGBA32F;
                if (type === gl.HALF_FLOAT) internalFormat = gl.RGBA16F;
                if (type === gl.UNSIGNED_BYTE) internalFormat = gl.RGBA8;
                break;
            case gl.DEPTH_COMPONENT:
                if (type === gl.UNSIGNED_SHORT) {
                    internalFormat = gl.DEPTH_COMPONENT16;
                } else {
                    internalFormat = gl.DEPTH_COMPONENT24;
                }
                break;
            case gl.DEPTH_STENCIL:
                internalFormat = gl.DEPTH24_STENCIL8;
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

    // 设置绘制使用的纹理
    public static setTextureAt(unit: number, texture: Texture | null, target: GLenum = GLDevice.gl.TEXTURE_2D) {
        // fix me: optimize
        // 是否记录一下当前的所有unit的纹理对象，只有不同时才调用gl.bindTexture？

        GLDevice.gl.activeTexture(GLTextures.glUnitFrom(unit));
        if (texture) {
            if (GLDevice.renderTarget) {
                for(let i = 0; i < 4; i++) {
                    if (GLDevice.renderTarget.getTexture(i) === texture) {
                        throw new Error("texture is using as render target");
                    }
                }
                if (GLDevice.renderTarget.depthStencilTexture === texture) {
                    throw new Error("texture is using as render target");
                }
            }
            // todo: 2d or 3d or cube or array
            GLDevice.gl.bindTexture(texture.target, texture.glTexture);
        } else {
            GLDevice.gl.bindTexture(target, null);
        }
        this.textures[unit] = texture;
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
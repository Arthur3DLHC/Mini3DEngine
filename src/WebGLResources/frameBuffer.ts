import { GLDevice } from "./glDevice.js";
import { Texture } from "./textures/texture.js";
import { RenderBuffer } from "./renderBuffer.js";

export class FrameBuffer {
    public constructor() {
        this.glFrameBuffer = null;
        this._needUpdate = true;
        this._textures = [];
        this._depthStencilBuffer = null;
        this._depthStencilTexture = null;
    }
    public glFrameBuffer: WebGLFramebuffer | null;

    // 下列成员使用弱引用，使得可以多个 FrameBuffer 共享
    public setTexture(index: number, texture: Texture | null) {
        if (this._textures[index] !== texture) {
            this._textures[index] = texture;            
            this._needUpdate = true;
        }
    }
    public getTexture(index: number): Texture | null {
        if (this._textures[index] !== undefined) {
            return this._textures[index];
        }
        return null;
    }
    // todo: depthstencil renderbuffer
    // todo: depthstencil texture?
    public get depthStencilBuffer(): RenderBuffer | null {
        return this._depthStencilBuffer;
    }
    public set depthStencilBuffer(buffer: RenderBuffer | null) {
        if (this._depthStencilBuffer !== buffer) {
            this._depthStencilBuffer = buffer;
            this._needUpdate = true;            
        }
    }

    public get depthStencilTexture() : Texture | null {
        return this._depthStencilTexture;
    }
    public set depthStencilTexture(texture: Texture | null) {
        if (this._depthStencilTexture !== texture) {
            this._depthStencilTexture = texture;
            this._needUpdate = true;
        }
    }

    private _textures: (Texture|null)[];
    private _depthStencilBuffer: RenderBuffer | null;
    private _depthStencilTexture: Texture | null;
    private _needUpdate: boolean;

    public prepare() {
        if (!this.glFrameBuffer) {
            this.glFrameBuffer = GLDevice.gl.createFramebuffer();
        }
        if (this._needUpdate) {
            GLDevice.gl.bindFramebuffer(GLDevice.gl.DRAW_FRAMEBUFFER, this.glFrameBuffer);
            const attachments: GLenum[] = [];
            // TODO: attach textures and depth stencil buffers
            for(let i = 0; i < this._textures.length && i < 4; i++) {
                let attachment = GLDevice.gl.COLOR_ATTACHMENT0;
                switch (i) {
                    case 0:
                        attachment = GLDevice.gl.COLOR_ATTACHMENT0;
                        break;
                    case 1:
                        attachment = GLDevice.gl.COLOR_ATTACHMENT1;
                        break;
                    case 2:
                        attachment = GLDevice.gl.COLOR_ATTACHMENT2;
                        break;
                    case 3:
                        attachment = GLDevice.gl.COLOR_ATTACHMENT3;
                        break;
                    default:
                        throw new Error("Color attachment not supported:" + i);
                        break;
                }
                // if texture not created, create it
                let texture: Texture|null = this._textures[i];
                if (texture !== null) {
                    if (texture.samplerState !== null) {
                        if (texture.samplerState.minFilter !== GLDevice.gl.NEAREST || texture.samplerState.magFilter !== GLDevice.gl.NEAREST) {
                            throw new Error("Texture as rendertarget muse has nearest filter");
                        }    
                    }
                    
                    if (!texture.glTexture) {
                        texture.create();
                    }

                    GLDevice.gl.framebufferTexture2D(GLDevice.gl.DRAW_FRAMEBUFFER, attachment, GLDevice.gl.TEXTURE_2D, texture.glTexture, 0);
                    attachments.push(attachment);
                } else {
                    GLDevice.gl.framebufferTexture2D(GLDevice.gl.DRAW_FRAMEBUFFER, attachment, GLDevice.gl.TEXTURE_2D, null, 0);
                }
            }

            // 如果同时设置了 depthstencilbuffer 和 depthstenciltexture，优先使用 depthstenciltexture？或者报错
            if (this._depthStencilTexture) {
                if (!this._depthStencilTexture.glTexture) {
                    this._depthStencilTexture.create();
                }
                let attachment = GLDevice.gl.DEPTH_STENCIL_ATTACHMENT;
                if (this._depthStencilTexture.format === GLDevice.gl.DEPTH_COMPONENT) {
                    attachment = GLDevice.gl.DEPTH_ATTACHMENT;
                }
                GLDevice.gl.framebufferTexture2D(GLDevice.gl.DRAW_FRAMEBUFFER, attachment, GLDevice.gl.TEXTURE_2D, this._depthStencilTexture.glTexture, 0);

            } else {
                GLDevice.gl.framebufferTexture2D(GLDevice.gl.DRAW_FRAMEBUFFER, GLDevice.gl.DEPTH_STENCIL_ATTACHMENT, GLDevice.gl.TEXTURE_2D, null, 0);
                GLDevice.gl.framebufferTexture2D(GLDevice.gl.DRAW_FRAMEBUFFER, GLDevice.gl.DEPTH_ATTACHMENT, GLDevice.gl.TEXTURE_2D, null, 0);
                if (this._depthStencilBuffer) {
                    if (!this._depthStencilBuffer.glBuffer) {
                        this._depthStencilBuffer.create();
                    }
                    let attachment = GLDevice.gl.DEPTH_STENCIL_ATTACHMENT;
                    if (this._depthStencilBuffer.format === GLDevice.gl.DEPTH_COMPONENT) {
                        attachment = GLDevice.gl.DEPTH_ATTACHMENT;
                    }
                    GLDevice.gl.framebufferRenderbuffer(GLDevice.gl.DRAW_FRAMEBUFFER, attachment, GLDevice.gl.RENDERBUFFER, this._depthStencilBuffer.glBuffer);
                }
            }

            const status = GLDevice.gl.checkFramebufferStatus(GLDevice.gl.DRAW_FRAMEBUFFER);
            if (status !== GLDevice.gl.FRAMEBUFFER_COMPLETE) {
                switch (status) {
                    case GLDevice.gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                        console.error("framebuffer incomplete attachment")
                        break;
                    case GLDevice.gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                        console.error("framebuffer incomplete missing attachment")
                        break;
                    case GLDevice.gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                        console.error("framebuffer incomplete dimensions")
                        break;
                    case GLDevice.gl.FRAMEBUFFER_UNSUPPORTED:
                        console.error("framebuffer unsupported")
                        break;
                    case GLDevice.gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
                        console.error("framebuffer incomplete multisample")
                        break;
                    default:
                        break;
                }
            }

            // drawbuffers 设置会保存在 GL 的 frame buffer object 中
            GLDevice.gl.drawBuffers(attachments);
            this._needUpdate = false;
            GLDevice.gl.bindFramebuffer(GLDevice.gl.DRAW_FRAMEBUFFER, null);
        }
    }

    public release() {
        if (this.glFrameBuffer) {
            GLDevice.gl.deleteFramebuffer(this.glFrameBuffer);
            this.glFrameBuffer = null;
        }
    }
}
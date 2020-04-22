import { GLDevice } from "./glDevice.js";
import { Texture } from "./textures/texture.js";
import { RenderBuffer } from "./renderBuffer.js";

export class FrameBuffer {
    public constructor(width: number, height: number) {
        this.glFrameBuffer = null;
        this._needUpdate = true;
        this._textures = [];
        this._depthStencilBuffer = null;
        this._depthStencilTexture = null;
    }
    public glFrameBuffer: WebGLFramebuffer | null;

    // 下列成员使用弱引用，使得可以多个 FrameBuffer 共享
    // todo: mrt textures
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
            GLDevice.gl.bindFramebuffer(GLDevice.gl.FRAMEBUFFER, this.glFrameBuffer);
            const attachments: GLenum[] = [];
            // TODO: attach textures and depth stencil buffers
            for(let i = 0; i < this._textures.length && i < 4; i++) {
                // if texture not created, create it
                let texture: Texture|null = this._textures[i];                 
                if (texture !== null) {
                    if (!texture.glTexture) {
                        texture.create();                        
                    }
                    GLDevice.gl.framebufferTexture2D(GLDevice.gl.DRAW_FRAMEBUFFER, GLDevice.gl.COLOR_ATTACHMENT0 + i, GLDevice.gl.TEXTURE_2D, texture.glTexture, 0);
                    attachments.push(GLDevice.gl.COLOR_ATTACHMENT0 + i);
                } else {
                    GLDevice.gl.framebufferTexture2D(GLDevice.gl.DRAW_FRAMEBUFFER, GLDevice.gl.COLOR_ATTACHMENT0 + i, GLDevice.gl.TEXTURE_2D, null, 0);
                }
            }

            // 如果同时设置了 depthstencilbuffer 和 depthstenciltexture，优先使用 depthstenciltexture？或者报错
            if (this._depthStencilTexture) {
                if (!this._depthStencilTexture.glTexture) {
                    this._depthStencilTexture.create();
                }
                GLDevice.gl.framebufferTexture2D(GLDevice.gl.DRAW_FRAMEBUFFER, GLDevice.gl.DEPTH_STENCIL_ATTACHMENT, GLDevice.gl.TEXTURE_2D, this._depthStencilTexture.glTexture, 0);
            } else{
                GLDevice.gl.framebufferTexture2D(GLDevice.gl.DRAW_FRAMEBUFFER, GLDevice.gl.DEPTH_STENCIL_ATTACHMENT, GLDevice.gl.TEXTURE_2D, null, 0);
                if (this._depthStencilBuffer) {
                    if (!this._depthStencilBuffer.glBuffer) {
                        this._depthStencilBuffer.create();
                    }
                    GLDevice.gl.framebufferRenderbuffer(GLDevice.gl.DRAW_FRAMEBUFFER, GLDevice.gl.DEPTH_STENCIL_ATTACHMENT, GLDevice.gl.RENDERBUFFER, this._depthStencilBuffer.glBuffer);
                }
            } 

            // drawbuffers 设置会保存在 GL 的 frame buffer object 中
            GLDevice.gl.drawBuffers(attachments);
            this._needUpdate = false;
            GLDevice.gl.bindFramebuffer(GLDevice.gl.FRAMEBUFFER, null);
        }
    }

    public release() {
        if (this.glFrameBuffer) {
            GLDevice.gl.deleteFramebuffer(this.glFrameBuffer);
            this.glFrameBuffer = null;
        }
    }
}
import { GLDevice } from "./glDevice.js";
import { Texture } from "./textures/texture.js";
import { RenderBuffer } from "./renderBuffer.js";

export class FrameBuffer {
    public constructor() {
        this.glFrameBuffer = null;
        this._needUpdate = true;
        this._textures = [];
        this._textureLevels = [];
        this._textureLayers = [];
        this._depthStencilBuffer = null;
        this._depthStencilTexture = null;
    }
    public glFrameBuffer: WebGLFramebuffer | null;

    /**
     * 
     * @param index 
     * @param texture 
     * @param layer if texture is array texture, this is the layer to bind. or should use -1
     */
    public setTexture(index: number, texture: Texture | null, level: number = 0, layer: number = -1) {
        if (this._textures[index] !== texture || this._textureLevels[index] !== level || this._textureLayers[index] !== layer) {
            this._textures[index] = texture;
            this._textureLevels[index] = level;
            this._textureLayers[index] = layer;
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
    private _textureLevels: number[];
    private _textureLayers: number[];
    private _depthStencilBuffer: RenderBuffer | null;
    private _depthStencilTexture: Texture | null;
    private _needUpdate: boolean;

    /**
     * fix me: this will disturb the current render target of GLDevice
     */
    public prepare() {
        const gl = GLDevice.gl;
        if (!this.glFrameBuffer) {
            this.glFrameBuffer = gl.createFramebuffer();
        }
        if (this._needUpdate) {
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.glFrameBuffer);
            const attachments: GLenum[] = [];
            // TODO: attach textures and depth stencil buffers
            for(let i = 0; i < this._textures.length && i < 4; i++) {
                let attachment = gl.COLOR_ATTACHMENT0;
                switch (i) {
                    case 0:
                        attachment = gl.COLOR_ATTACHMENT0;
                        break;
                    case 1:
                        attachment = gl.COLOR_ATTACHMENT1;
                        break;
                    case 2:
                        attachment = gl.COLOR_ATTACHMENT2;
                        break;
                    case 3:
                        attachment = gl.COLOR_ATTACHMENT3;
                        break;
                    default:
                        throw new Error("Color attachment not supported:" + i);
                        break;
                }
                // if texture not created, create it

                // fix me: if not in array, the value is 0 or undefined?
                let texture: Texture|null = this._textures[i];
                let level: number = this._textureLevels[i];
                let layer: number = this._textureLayers[i];
                if (texture !== null) {
                    // if (texture.samplerState !== null) {
                    //     if (texture.samplerState.minFilter !== gl.NEAREST || texture.samplerState.magFilter !== gl.NEAREST) {
                    //         throw new Error("Texture as rendertarget muse has nearest filter");
                    //     }    
                    // }
                    
                    if (!texture.glTexture) {
                        texture.create();
                    }

                    if (layer !== undefined && layer >= 0) {
                        gl.framebufferTextureLayer(gl.DRAW_FRAMEBUFFER, attachment, texture.glTexture, level, layer);
                    } else {
                        gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture.glTexture, level);
                    }
                    attachments.push(attachment);
                } else {
                    gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, attachment, gl.TEXTURE_2D, null, 0);
                    gl.framebufferTextureLayer(gl.DRAW_FRAMEBUFFER, attachment, null, 0, 0);
                }
            }

            // 如果同时设置了 depthstencilbuffer 和 depthstenciltexture，优先使用 depthstenciltexture？或者报错
            if (this._depthStencilTexture) {
                if (!this._depthStencilTexture.glTexture) {
                    this._depthStencilTexture.create();
                }
                let attachment = gl.DEPTH_STENCIL_ATTACHMENT;
                if (this._depthStencilTexture.format === gl.DEPTH_COMPONENT) {
                    attachment = gl.DEPTH_ATTACHMENT;
                }
                gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, attachment, gl.TEXTURE_2D, this._depthStencilTexture.glTexture, 0);

            } else {
                gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, null, 0);
                gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, null, 0);
                if (this._depthStencilBuffer) {
                    if (!this._depthStencilBuffer.glBuffer) {
                        this._depthStencilBuffer.create();
                    }
                    let attachment = gl.DEPTH_STENCIL_ATTACHMENT;
                    if (this._depthStencilBuffer.format === gl.DEPTH_COMPONENT) {
                        attachment = gl.DEPTH_ATTACHMENT;
                    }
                    gl.framebufferRenderbuffer(gl.DRAW_FRAMEBUFFER, attachment, gl.RENDERBUFFER, this._depthStencilBuffer.glBuffer);
                }
            }

            const status = gl.checkFramebufferStatus(gl.DRAW_FRAMEBUFFER);
            if (status !== gl.FRAMEBUFFER_COMPLETE) {
                switch (status) {
                    case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                        console.error("framebuffer incomplete attachment")
                        break;
                    case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                        console.error("framebuffer incomplete missing attachment")
                        break;
                    case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                        console.error("framebuffer incomplete dimensions")
                        break;
                    case gl.FRAMEBUFFER_UNSUPPORTED:
                        console.error("framebuffer unsupported")
                        break;
                    case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
                        console.error("framebuffer incomplete multisample")
                        break;
                    default:
                        break;
                }
            }

            // drawbuffers 设置会保存在 GL 的 frame buffer object 中
            gl.drawBuffers(attachments);
            this._needUpdate = false;
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        }
    }

    public release() {
        if (this.glFrameBuffer) {
            GLDevice.gl.deleteFramebuffer(this.glFrameBuffer);
            this.glFrameBuffer = null;
        }
    }
}
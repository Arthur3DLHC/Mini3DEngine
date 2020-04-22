import { GLDevice } from "./glDevice.js";

/**
 * renderbuffer object for depth stencil buffer etc.
 */
export class RenderBuffer {
    public constructor() {
        this.glBuffer = null;
        this.width = 0;
        this.height = 0;
        this.format = GLDevice.gl.DEPTH24_STENCIL8;
    }

    public glBuffer: WebGLRenderbuffer | null;
    public width: number;
    public height: number;
    public format: GLenum;

    public create() {
        if (this.glBuffer) {
            throw new Error("Already created.");
        }
        if (this.width <= 0 || this.height <= 0) {
            throw new Error("width and height must > 0.");
        }
        this.glBuffer = GLDevice.gl.createRenderbuffer();
        GLDevice.gl.bindRenderbuffer(GLDevice.gl.RENDERBUFFER, this.glBuffer);
        GLDevice.gl.renderbufferStorage(GLDevice.gl.RENDERBUFFER, this.format, this.width, this.height);
        GLDevice.gl.bindRenderbuffer(GLDevice.gl.RENDERBUFFER, null);
    }

    public release() {
        if (this.glBuffer) {
            GLDevice.gl.deleteRenderbuffer(this.glBuffer);
            this.glBuffer = null;
        }
    }
}
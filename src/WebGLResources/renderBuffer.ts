import { GLDevice } from "./glDevice.js";

/**
 * renderbuffer object for depth stencil buffer etc.
 */
export class RenderBuffer {
    public constructor() {
        this.glBuffer = null;
    }

    public glBuffer: WebGLRenderbuffer | null;

    public create() {
        throw new Error("Not implemented");
    }

    public release() {
        if (this.glBuffer) {
            GLDevice.gl.deleteRenderbuffer(this.glBuffer);
            this.glBuffer = null;
        }
    }
}
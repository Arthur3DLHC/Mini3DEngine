import { GLDevice } from "./glDevice";

export class FrameBuffer {
    public constructor() {
        this.glFrameBuffer = null;
    }
    public glFrameBuffer: WebGLFramebuffer | null;

    // todo: mrt textures
    // todo: depthstencil renderbuffer
    // todo: depthstencil texture?

    public release() {
        if (this.glFrameBuffer) {
            GLDevice.gl.deleteFramebuffer(this.glFrameBuffer);
            this.glFrameBuffer = null;
        }
    }
}
import { GLDevice } from "./glDevice";

export class IndexBuffer {
    public constructor() {
        this.glBuffer = null;
        this.indices = null;
    }

    public glBuffer: WebGLBuffer | null;
    public indices: Int32Array | null;

    public release() {
        if (this.glBuffer) {
            GLDevice.gl.deleteBuffer(this.glBuffer);
            this.glBuffer = null;
        }
    }
}
import { GLDevice } from "./glDevice";

export class IndexBuffer {
    public constructor() {
        this.glBuffer = null;
        this.indices = null;
    }

    public glBuffer: WebGLBuffer | null;
    /**
     * WebGL can only use 8 or 16 bit indices? no 32 bit support?
     */
    public indices: Int16Array | null;

    public create() {
        
    }

    public release() {
        if (this.glBuffer) {
            GLDevice.gl.deleteBuffer(this.glBuffer);
            this.glBuffer = null;
        }
    }
}
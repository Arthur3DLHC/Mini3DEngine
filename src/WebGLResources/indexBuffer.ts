import { GLDevice } from "./glDevice.js";

export class IndexBuffer {
    public constructor(usage: GLenum) {
        this.glBuffer = null;
        this.indices = null;
        this._usage = usage;
        this.componentType = GLDevice.gl.UNSIGNED_SHORT;
    }

    public glBuffer: WebGLBuffer | null;
    /**
     * WebGL can only use 8 or 16 bit indices? no 32 bit support?
     */
    public indices: Uint8Array | Uint16Array | null;

    public componentType: GLenum;

    private _usage: GLenum;

    public create() {
        if (this.glBuffer) {
            throw new Error("Already created.");
        }
        this.glBuffer = GLDevice.gl.createBuffer();
        if (this.indices && this.glBuffer) {
            GLDevice.gl.bindBuffer(GLDevice.gl.ELEMENT_ARRAY_BUFFER, this.glBuffer);
            GLDevice.gl.bufferData(GLDevice.gl.ELEMENT_ARRAY_BUFFER, this.indices, this._usage);
            GLDevice.gl.bindBuffer(GLDevice.gl.ELEMENT_ARRAY_BUFFER, null);
        }
    }

    public update() {
        if (!this.glBuffer) {
            throw new Error("Buffer not created yet.");
        }
        if (this.indices) {
            GLDevice.gl.bindBuffer(GLDevice.gl.ELEMENT_ARRAY_BUFFER, this.glBuffer);
            GLDevice.gl.bufferSubData(GLDevice.gl.ELEMENT_ARRAY_BUFFER, 0, this.indices);
            GLDevice.gl.bindBuffer(GLDevice.gl.ELEMENT_ARRAY_BUFFER, null);
        }
    }

    public release() {
        if (this.glBuffer) {
            GLDevice.gl.deleteBuffer(this.glBuffer);
            this.glBuffer = null;
        }
    }
}
import { GLDevice } from "./glDevice.js";

/**
 * Interleaved vertex buffer
 */
export class VertexBuffer {
    public constructor(usage: GLenum) {
        this.stride = 0;
        this.glBuffer = null;
        this.data = null;
        this._usage = usage;
    }

    /**
     * vertex stride, in bytes
     */
    public stride: number;

    /**
     * WebGL buffer object
     */
    public glBuffer: WebGLBuffer | null;

    /**
     * 为简单起见，只支持浮点数数据？
     * 如果是从 glTF 加载的，则暂时不使用此属性？
     * 或者将此属性做成多种类型的数组（TypedArray）？
     */
    public data: Float32Array | null;

    public get vertexCount(): number {
        if (this.data && this.stride > 0) {
            return this.data.length / (this.stride / 4);
        }
        return 0;
    }

    private _usage: GLenum;

    public create() {
        if (this.glBuffer) {
            throw new Error("Already created.");
        }
        this.glBuffer = GLDevice.gl.createBuffer();
        if (this.data && this.glBuffer) {
            GLDevice.gl.bindBuffer(GLDevice.gl.ARRAY_BUFFER, this.glBuffer);
            GLDevice.gl.bufferData(GLDevice.gl.ARRAY_BUFFER, this.data, this._usage);
            GLDevice.gl.bindBuffer(GLDevice.gl.ARRAY_BUFFER, null);
        }
    }

    public update() {
        // use gl.bufferSubData ?
        // if length is not enough, recreate a buffer?
        if (!this.glBuffer) {
            throw new Error("Buffer not created yet.");
        }
        if (this.data) {
            GLDevice.gl.bindBuffer(GLDevice.gl.ARRAY_BUFFER, this.glBuffer);
            GLDevice.gl.bufferSubData(GLDevice.gl.ARRAY_BUFFER, 0, this.data);
            GLDevice.gl.bindBuffer(GLDevice.gl.ARRAY_BUFFER, null);
        }
    }
        
    public release() {
        if (this.glBuffer) {
            GLDevice.gl.deleteBuffer(this.glBuffer);
            this.glBuffer = null;
        }
    }
}
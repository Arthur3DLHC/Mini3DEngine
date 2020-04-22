import { GLDevice } from "./glDevice";

/**
 * Interleaved vertex buffer
 */
export class VertexBuffer {
    public constructor() {
        this.stride = 0;
        this.glBuffer = null;
        this.data = null;
    }

    /**
     * vertex stride
     */
    public stride: number;

    /**
     * WebGL buffer object
     */
    public glBuffer: WebGLBuffer | null;

    /**
     * 为简单起见，只支持浮点数数据？
     * 如果是从 glTF 加载的，则暂时不使用此属性？
     */
    public data: Float32Array | null;
        
    public release() {
        if (this.glBuffer) {
            GLDevice.gl.deleteBuffer(this.glBuffer);
            this.glBuffer = null;
        }
    }
}
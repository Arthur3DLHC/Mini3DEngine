/**
 * Interleaved vertex buffer
 */
export class VertexBuffer {
    public constructor() {
        this.stride = 0;
        this.buffer = null;
        this.data = null;
    }

    /**
     * vertex stride
     */
    public stride: number;

    public buffer: WebGLBuffer | null;

    // todo: vertex data?
    public data: Float32Array | null;
}
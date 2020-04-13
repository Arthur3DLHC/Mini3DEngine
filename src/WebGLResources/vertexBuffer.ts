/**
 * Interleaved vertex buffer
 */
export class VertexBuffer {
    public constructor() {
        this.stride = 0;
        this.buffer = null;
    }

    /**
     * vertex stride
     */
    public stride: number;

    public buffer: WebGLBuffer | null;

    // todo: vertex data?
}
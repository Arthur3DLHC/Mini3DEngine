export class UniformBuffer {
    public constructor() {
        this.bufferData = null;
        this.bufferGL = null;
    }
    public bufferData: Float32Array | null;
    public bufferGL: WebGLBuffer | null;

    // todo: method for add/set/remove named uniform variables
}
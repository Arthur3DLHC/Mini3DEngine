export class UniformBuffer {
    public constructor() {
        this.bufferData = null;
        this.bufferGL = 0;
    }
    public bufferData: Float32Array;
    public bufferGL: WebGLBuffer;

    // todo: method for add/set/remove named uniform variables
}
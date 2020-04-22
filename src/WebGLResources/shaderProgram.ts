export class ShaderProgram {
    public constructor() {
        this.program = null;
    }

    public program: WebGLProgram | null;

    public release() {
        throw new Error("Not implemented.");
    }
}
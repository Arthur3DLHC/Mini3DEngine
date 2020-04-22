import { GLDevice } from "./glDevice.js";

export class ShaderProgram {
    public constructor() {
        this.glProgram = null;
    }

    public glProgram: WebGLProgram | null;

    public release() {
        if (this.glProgram) {
            GLDevice.gl.deleteProgram(this.glProgram);
            this.glProgram = null;
        }
    }
}
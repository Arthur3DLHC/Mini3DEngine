import { GLDevice } from "../glDevice.js";

export class CullState {
    public constructor() {
        this.enable = true;
        this.mode = GLDevice.gl.BACK;
    }

    public enable: boolean;
    public mode: GLenum;

    public equals(other: CullState): boolean {
        return this.enable === other.enable && this.mode === other.mode;
    }

    public apply() {
        if (this.enable) {
            GLDevice.gl.enable(GLDevice.gl.CULL_FACE);
        } else {
            GLDevice.gl.disable(GLDevice.gl.CULL_FACE);
        }
        GLDevice.gl.cullFace(this.mode);
    }
}
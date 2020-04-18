import { GLDevice } from "../glDevice.js";

export class DepthStencilState {
    public constructor() {
        this.enable = true;
        this.write = true;
        this.compareFunction = GLDevice.gl.LEQUAL;
    }

    public enable: boolean;
    public write: boolean;
    public compareFunction: GLenum;
    // todo: depth offset?

    public equals(other: DepthStencilState): boolean {
        return this.enable === other.enable && this.write === other.write
         && this.compareFunction === other.compareFunction;
    }

    public apply() {
        if (this.enable) {
            GLDevice.gl.enable(GLDevice.gl.DEPTH_TEST);
        } else {
            GLDevice.gl.disable(GLDevice.gl.DEPTH_TEST);
        }
        GLDevice.gl.depthMask(this.write);
        GLDevice.gl.depthFunc(this.compareFunction);
    }
}
import { GLDevice } from "../glDevice.js";

/**
 * alpha blend states
 */
export class BlendState {
    public constructor() {
        this.enable = false;
        // this.alphaClip = false;
        // this.clipRef = 0.01;
        this.equation = GLDevice.gl.FUNC_ADD;
        this.srcFactor = GLDevice.gl.SRC_ALPHA;
        this.destFactor = GLDevice.gl.ONE_MINUS_SRC_ALPHA;
    }
    // alpha blend states
    public enable: boolean;

    // WebGL does not have alpha test. use 'discard' in shader
    // public alphaClip: boolean;
    // public clipRef: number;
    public equation: GLenum;
    public srcFactor: GLenum;
    public destFactor: GLenum;
    // todo: saparate alpa channel blend function?

    public equals(other: BlendState):boolean {
        return this.enable === other.enable
        // && this.alphaClip === other.alphaClip
        // && this.clipRef === other.clipRef
        && this.equation === other.equation
        && this.srcFactor === other.srcFactor
        && this.destFactor === other.destFactor;
    }

    public apply() {
        if (this.enable) {
            GLDevice.gl.enable(GLDevice.gl.BLEND);
        } else {
            GLDevice.gl.disable(GLDevice.gl.BLEND);
        }
        GLDevice.gl.blendEquation(this.equation);
        GLDevice.gl.blendFunc(this.srcFactor, this.destFactor);
    }
}
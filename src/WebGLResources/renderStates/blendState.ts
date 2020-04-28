import { GLDevice } from "../glDevice.js";

/**
 * alpha blend states
 */
export class BlendState {
    public constructor(enable: boolean = false, equation: GLenum = GLDevice.gl.FUNC_ADD, sFactor = GLDevice.gl.SRC_ALPHA, dFactor = GLDevice.gl.ONE_MINUS_SRC_ALPHA) {
        this._enable = enable;
        // this.alphaClip = false;
        // this.clipRef = 0.01;
        this._equation = equation;
        this._srcFactor = sFactor;
        this._destFactor = dFactor;
    }
    // alpha blend states
    private _enable: boolean;
    public get enable(): boolean {
        return this._enable;
    }

    // WebGL does not have alpha test. use 'discard' in shader
    // public alphaClip: boolean;
    // public clipRef: number;
    private _equation: GLenum;
    public get equation(): GLenum {
        return this._equation;
    }

    private _srcFactor: GLenum;
    public get srcFactor(): GLenum {
        return this._srcFactor;
    }

    private _destFactor: GLenum;
    public get destFactor(): GLenum {
        return this._destFactor;
    }
    // todo: saparate alpa channel blend function?

    public equals(enable: boolean, equation: GLenum, srcFactor: GLenum, destFactor: GLenum):boolean {
        return this.enable === enable
        // && this.alphaClip === other.alphaClip
        // && this.clipRef === other.clipRef
        && this.equation === equation
        && this.srcFactor === srcFactor
        && this.destFactor === destFactor;
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
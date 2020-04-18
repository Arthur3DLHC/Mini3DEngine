import { GLDevice } from "../glDevice.js";

export class DepthStencilState {
    public constructor(enable: boolean = true, write: boolean = true, func: GLenum = GLDevice.gl.LEQUAL) {
        this._enable = enable;
        this._write = write;
        this._compareFunction = func;
    }

    private _enable: boolean;
    public get enable(): boolean {
        return this._enable;
    }
    private _write: boolean;
    public get write(): boolean {return this._write;}
    private _compareFunction: GLenum;
    public get compareFunction(): GLenum {return this._compareFunction;}
    // todo: polygon offset?

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
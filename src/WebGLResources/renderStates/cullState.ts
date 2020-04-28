import { GLDevice } from "../glDevice.js";

export class CullState {
    public constructor(enable: boolean = true, mode:GLenum = GLDevice.gl.BACK) {
        this._enable = enable;
        this._mode = mode;
    }

    private _enable: boolean;
    public get enable(): boolean {
        return this._enable;
    }

    private _mode: GLenum;
    public get mode(): GLenum {
        return this._mode;
    }

    public equals(enable: boolean, mode: GLenum): boolean {
        return this.enable === enable && this.mode === mode;
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
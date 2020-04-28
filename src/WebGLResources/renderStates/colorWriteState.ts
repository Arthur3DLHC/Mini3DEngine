import { GLDevice } from "../glDevice";

export class ColorWriteState {
    public constructor(red: boolean, green: boolean, blue: boolean, alpha: boolean) {
        this._red = red;
        this._green = green;
        this._blue = blue;
        this._alpha = alpha;
    }
    private _red: boolean;
    public get red(): boolean {
        return this._red;
    }
    private _green: boolean;
    public get green(): boolean {
        return this._green;
    }
    private _blue: boolean;
    public get blue(): boolean {
        return this._blue;
    }
    private _alpha: boolean;
    public get alpha(): boolean {
        return this._alpha;
    }

    public equals(red: boolean, green: boolean, blue: boolean, alpha: boolean) {
        return this.red === red && this.green === green && this.blue === blue && this.alpha === alpha;
    }

    public apply() {
        GLDevice.gl.colorMask(this.red, this.green, this.blue, this.alpha);
    }
}
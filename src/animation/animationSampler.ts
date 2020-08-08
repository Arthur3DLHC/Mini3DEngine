/**
 * animation frames data
 */

import { KeyframeTrack } from "./keyframeTrack.js";

export enum Interpolation {
    LINEAR,
    STEP,
    CUBICSPLINE,
}

/**
 * animation sampler
 * not cached, 1 per animating channel
 */
export class AnimationSampler {
    public constructor(_keyframes: KeyframeTrack) {
        this.keyframes = _keyframes;
    }
    public keyframes: KeyframeTrack;
    /** floats count per key */
    public set stride(val: number){
        this._stride = val;
        this._tmpValue.length = val;
    }
    public get stride(): number {
        return this._stride;
    }
    // public dataType: string = DataTypes.SCALAR;      // use path to determine?
    public interpolation: Interpolation = Interpolation.LINEAR;

    private _curKeyIndex: number = 0;
    private _tmpValue: number[] = [0];
    private _stride: number = 1;

    // todo: interpolator

    // when query a new time, search start from current keyframe.

    public evaluate(time: number): number[] {
        if (this.keyframes === null) {
            throw new Error("No animation data in sampler");
        }

        // find the keyframes before and after the time
        // then interpolate them

        return this._tmpValue;
    }
}
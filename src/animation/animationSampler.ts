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

    public evaluate(time: number, isQuaternion: boolean): number[] {
        // find the keyframes before and after the time
        // then interpolate them

        let input = this.keyframes.input;
        let output = this.keyframes.output;
        let curKeyTime = input[this._curKeyIndex];

        if (time === curKeyTime) {
            for(let i = 0; i < this.stride; i++) {
                this._tmpValue[i] = output[this._curKeyIndex * this.stride + i];
            }
            return this._tmpValue;
        }

        let nextKeyIdx = this._curKeyIndex;

        if (time > curKeyTime) {
            for (nextKeyIdx = this._curKeyIndex; nextKeyIdx < input.length; nextKeyIdx++) {
                if (time < input[nextKeyIdx]) {
                    break;
                }
            }
            this._curKeyIndex = nextKeyIdx - 1;
            nextKeyIdx = Math.min(input.length - 1);
        }

        if (time < curKeyTime) {
            for (nextKeyIdx = this._curKeyIndex; nextKeyIdx >= 0; nextKeyIdx--) {
                if (input[nextKeyIdx] < time) {
                    break;
                }
            }
            this._curKeyIndex = nextKeyIdx + 1;
            nextKeyIdx = Math.max(nextKeyIdx, 0);
        }

        // todo: interpolate
        // how about quaternion?
        if (isQuaternion) {
            
        } else {

        }

        return this._tmpValue;
    }
}
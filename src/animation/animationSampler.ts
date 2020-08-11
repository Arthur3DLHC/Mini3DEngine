/**
 * animation frames data
 */

import { KeyframeTrack } from "./keyframeTrack.js";
import quat from "../../lib/tsm/quat.js";
import vec3 from "../../lib/tsm/vec3.js";

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

    private _prevQuat: quat = new quat();
    private _nextQuat: quat = new quat();
    private _resultQuat: quat = new quat();

    private _prevVec: vec3 = new vec3();
    private _nextVec: vec3 = new vec3();
    private _resultVec: vec3 = new vec3();

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

        curKeyTime = input[this._curKeyIndex];

        // todo: interpolate
        const dt = input[nextKeyIdx] - curKeyTime;
        const t = (time - curKeyTime) / dt;
        // how about quaternion?
        if (isQuaternion) {
            // use slerp of two quaternions
            this.getQuat(this._curKeyIndex, this._prevQuat);
            this.getQuat(nextKeyIdx, this._nextQuat);

            quat.mix(this._prevQuat, this._nextQuat, t, this._resultQuat);
            for (let i = 0; i < 4; i++) {
                this._tmpValue[i] = this._resultQuat.at(i);
            }
        } else {
            this.getVec(this._curKeyIndex, this._prevVec);
            this.getVec(nextKeyIdx, this._nextVec);

            vec3.mix(this._prevVec, this._nextVec, t, this._resultVec);
            for (let i = 0; i < 3; i++) {
                this._tmpValue[i] = this._resultVec.at(i);
            }
        }

        return this._tmpValue;
    }

    private getVec(index: number, result: vec3) {
        const output = this.keyframes.output;
        const start = index * 3;
        result.x = output[start];
        result.y = output[start + 1];
        result.z = output[start + 2];
    }

    private getQuat(index: number, result: quat) {
        const output = this.keyframes.output;
        const start = index * 4;
        result.x = output[start];
        result.y = output[start + 1];
        result.z = output[start + 2];
        result.w = output[start + 3];
    }
}
import { Object3D } from "../scene/object3D.js";
import { DataTypes } from "../math/dataType.js";
import { AnimationSampler } from "./animationSampler.js";
import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";
import quat from "../../lib/tsm/quat.js";


export const AnimTargetPath = {
    translation: "translation",
    rotation: "rotation",
    scale: "scale",
    weights: "weights",
};

export const AnimTargetPathDataType: {[index: string]: string} = {
    "translation": "VEC3",
    "rotation": "VEC4",
    "scale": "VEC3",
    "weights": "SCALAR"
};

export enum AnimationApplyMode {
    add,
    replace,
};

export class AnimationChannel {
    public constructor(_target: Object3D, _path: string, _sampler: AnimationSampler) {
        this.target = _target;
        this.path = _path;
        switch (this.path) {
            case AnimTargetPath.scale:
                this._targetVec3 = this.target.scale;
                break;
            case AnimTargetPath.rotation:
                this._targetQuat = this.target.rotation;
                break;
            case AnimTargetPath.translation:
                this._targetVec3 = this.target.translation;
                break;
            case AnimTargetPath.weights:
                break;
            default:
                break;
        }
        this.sampler = _sampler;
    }
    public target: Object3D;
    public path: string;

    public sampler: AnimationSampler;

    private _targetVec3: vec3 | undefined;
    private _targetQuat: quat | undefined;

    // todo: functions
    // sampler animation and apply to target
    public apply(time: number, weight: number, mode: AnimationApplyMode) {
        const value = this.sampler.evaluate(time);
        if (this._targetQuat !== undefined) {
            // use 'nlerp' of quaternion? less accurate, less computation
            // https://keithmaggio.wordpress.com/2011/02/15/math-magician-lerp-slerp-and-nlerp/
            // https://www.gamedev.net/forums/topic/645242-quaternions-and-animation-blending-questions/
            // NOTE: need to normalize after all quaternions are mixed together
            if (mode == AnimationApplyMode.replace) {
                this._targetQuat.x = value[0] * weight;
                this._targetQuat.y = value[1] * weight;
                this._targetQuat.z = value[2] * weight;
                this._targetQuat.w = value[3] * weight;
            } else {
                this._targetQuat.x = this._targetQuat.x + value[0] * weight;
                this._targetQuat.y = this._targetQuat.y + value[1] * weight;
                this._targetQuat.z = this._targetQuat.z + value[2] * weight;
                this._targetQuat.w = this._targetQuat.w + value[3] * weight;
            }
        } else if (this._targetVec3 !== undefined) {
            if (mode == AnimationApplyMode.replace) {
                this._targetVec3.x = value[0] * weight;
                this._targetVec3.y = value[1] * weight;
                this._targetVec3.z = value[2] * weight;
            } else {
                this._targetVec3.x = this._targetVec3.x + value[0] * weight;
                this._targetVec3.y = this._targetVec3.y + value[1] * weight;
                this._targetVec3.z = this._targetVec3.z + value[2] * weight;
            }
        }
    }
}
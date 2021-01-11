import { Object3D } from "../scene/object3D.js";
import { DataTypes } from "../math/dataType.js";
import { AnimationSampler } from "./animationSampler.js";
import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";
import quat from "../../lib/tsm/quat.js";
import { ObjectPropertiesMixer, QuatPropertyMixer, Vec3PropertyMixer } from "./objectPropertiesMixer.js";


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

    /** if not null, will apply weighted anim values to it */
    public targetMixer: ObjectPropertiesMixer | null = null;
    public targetVec3Mixer: Vec3PropertyMixer | undefined;
    public targetQuatMixer: QuatPropertyMixer | undefined;

    public sampler: AnimationSampler;

    private _targetVec3: vec3 | undefined;
    private _targetQuat: quat | undefined;

    // todo: functions
    // sampler animation and apply to target
    public apply(time: number, weight: number, mode: AnimationApplyMode) {
        const value = this.sampler.evaluate(time, this.path === AnimTargetPath.rotation);

        // check if targetMixer is used.
        if (this.targetMixer !== null) {
            // todo: check apply mode?
            // if replace, is that necessary to use mixers?
            if (mode === AnimationApplyMode.replace) {
                if (this.targetVec3Mixer !== undefined) {
                    this.targetVec3Mixer.mixReplaceArray(value, weight);
                } else if (this.targetQuatMixer !== undefined) {
                    this.targetQuatMixer.mixReplaceArray(value, weight);
                }
            } else {
                if (this.targetVec3Mixer !== undefined) {
                    this.targetVec3Mixer.mixAddtiveArray(value, weight);
                } else if (this.targetQuatMixer !== undefined) {
                    this.targetQuatMixer.mixAddtiveArray(value, weight);
                }
            }

        } else {
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
}
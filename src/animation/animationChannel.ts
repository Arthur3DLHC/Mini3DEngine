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
                this._tmpVec3 = this.target.scale;
                break;
            case AnimTargetPath.rotation:
                this._tmpQuat = this.target.rotation;
                break;
            case AnimTargetPath.translation:
                this._tmpVec3 = this.target.translation;
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

    private _tmpVec3: vec3 | undefined;
    private _tmpQuat: quat | undefined;

    // todo: functions
    // sampler animation and apply to target
    public apply(time: number, weight: number, mode: AnimationApplyMode) {
        const value = this.sampler.evaluate(time);
        if (this._tmpQuat !== undefined) {
            
        } else if (this._tmpVec3 !== undefined) {
            if (mode == AnimationApplyMode.replace) {
                this._tmpVec3.x = value[0] * weight;
                this._tmpVec3.y = value[1] * weight;
                this._tmpVec3.z = value[2] * weight;
            } else {
                this._tmpVec3.x = this._tmpVec3.x + value[0] * weight;
                this._tmpVec3.y = this._tmpVec3.y + value[1] * weight;
                this._tmpVec3.z = this._tmpVec3.z + value[2] * weight;
            }
        }
    }
}
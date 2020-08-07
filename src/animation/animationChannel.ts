import { Object3D } from "../scene/object3D.js";
import { DataTypes } from "../math/dataType.js";
import { AnimationSampler } from "./animationSampler.js";


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

export class AnimationChannel {
    public target: Object3D | null = null;
    public path: string = AnimTargetPath.translation;

    public sampler: AnimationSampler | null = null;

    // todo: functions
    // sampler animation and apply to target
}
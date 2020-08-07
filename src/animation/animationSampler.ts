/**
 * animation frames data
 */

import { AnimationData } from "./animationData.js";

export enum Interpolation {
    LINEAR,
    STEP,
    CUBICSPLINE,
}

export class AnimationSampler {
    public data: AnimationData | null = null;
    // public dataType: string = DataTypes.SCALAR;      // use path to determine?
    public interpolation: Interpolation = Interpolation.LINEAR;
}
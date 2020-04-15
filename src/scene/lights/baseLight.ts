import { vec4 } from "gl-matrix";
import { LightShadow } from "./lightShadow";

export class BaseLight {
    public constructor() {
        this.color = vec4.fromValues(1,1,1,1);
        this.intensity = 1;
        this.shadow = null;
    }
    public color: vec4;
    public intensity: number;
    /**
     * if null, the light will not cast shadow.
     * fix me: where to put the 'drop shadow' property? on object3D? or on material?
     */
    public shadow: LightShadow | null;
}
import { vec4 } from "gl-matrix";
import { LightShadow } from "./lightShadow.js";
import { BufferGeometry } from "../../geometry/bufferGeometry.js";
import { RenderList } from "../../renderer/renderList.js";

export class BaseLight {
    public constructor() {
        this.on = true;
        this.color = vec4.fromValues(1,1,1,1);
        this.intensity = 1;
        this.shadow = null;

        this.debugDraw = false;
    }
    /**
     * the light is switched on
     */
    public on: boolean;
    public color: vec4;
    public intensity: number;
    /**
     * if null, the light will not cast shadow.
     * fix me: where to put the 'drop shadow' property? on object3D? or on material?
     */
    public shadow: LightShadow | null;

    public debugDraw: boolean;


}
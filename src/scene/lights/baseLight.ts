import { LightShadow } from "./lightShadow.js";
import { LightType } from "./lightType.js";
import { Object3D } from "../object3D.js";
import { BoundingSphere } from "../../math/boundingSphere.js";

export class BaseLight extends Object3D {
    public constructor() {
        super();
        this.on = true;
        // this.color = vec4.fromValues(1,1,1,1);
        this.intensity = 1;
        this.shadow = null;
        this.isStatic = false;

        this.debugDraw = false;
    }
    /**
     * the light is switched on
     */
    public on: boolean;
    // public color: vec4;
    public intensity: number;
    /**
     * if null, the light will not cast shadow.
     * fix me: where to put the 'drop shadow' property? on object3D? or on material?
     */
    public shadow: LightShadow | null;

    /**
     * light do not change any properties, except on/off
     * for optimization
     */
    public isStatic: boolean;

    public debugDraw: boolean;

    public get type() : LightType {
        return LightType.Unknow;
    }

    /**
     * the bounding sphere of this light, in local space
     */
    public get boundingSphere(): BoundingSphere{
        return this._boundingSphere;
    }

    protected _boundingSphere: BoundingSphere = new BoundingSphere();

    public destroy(destroyChildren: boolean) {
        // release alloced shadowmap atlas
        if (this.shadow) {
            // indicate the shadowmap atlas will not be used anymore.
            this.shadow.shadowMap = null;
        }
        super.destroy(destroyChildren);
    }
}
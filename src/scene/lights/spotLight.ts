import { BaseLight } from "./baseLight.js";
import { SpotLightShadow } from "./spotLightShadow.js";

export class SpotLight extends BaseLight {
    public constructor() {
        super();
        this.angle = 60;
        this.penumbra = 0;
        this.shadow = new SpotLightShadow(this);
    }

    /**
     * the whole cone angle, in degrees.
     */
    public angle: number;

    /**
     * 半影区占比。范围：0 ~ 1。默认值：0 （无半影区）
     */
    public penumbra: number;
}
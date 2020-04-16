import { BaseLight } from "./baseLight.js";
import { PointLightShadow } from "./pointLightShadow.js";

export class PointLight extends BaseLight {
    public constructor() {
        super();
        this.distance = 0;
        this.shadow = new PointLightShadow(this);
    }

    /**
     * if 0, infinity; or the intensity will fade out to zero at the distance.
     */
    public distance: number;
}
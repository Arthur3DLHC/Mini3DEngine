import { BaseLight } from "./baseLight.js";
import { DirectionalLightShadow } from "./directionalLightShadow.js";

export class DirectionalLight extends BaseLight {
    public constructor() {
        super();
        this.radius = 0;
        this.shadow = new DirectionalLightShadow(this);
    }

    /**
     * radius of the light cylinder.
     * if zero, use infinite radius; and this.shadow.radius will be used as shadow radius.
     */
    public radius: number;
}
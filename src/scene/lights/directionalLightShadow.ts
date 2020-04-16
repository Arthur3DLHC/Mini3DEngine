import { LightShadow } from "./lightShadow.js";
import { DirectionalLight } from "./directionalLight.js";

export class DirectionalLightShadow extends LightShadow {
    public constructor(light: DirectionalLight) {
        super(light);
        this.radius = 0;
    }

    /**
     * the radius of the directional light shadow.
     * if zero, automatically use the light radius as shadow radius.
     */
    public radius: number;
}
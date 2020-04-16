import { LightShadow } from "./lightShadow.js";
import { PointLight } from "./pointLight.js";

export class PointLightShadow extends LightShadow {
    public constructor(light: PointLight) {
        super(light);
    }
}
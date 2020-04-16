import { LightShadow } from "./lightShadow.js";
import { SpotLight } from "./spotLight.js";

export class SpotLightShadow extends LightShadow {
    public constructor(light: SpotLight) {
        super(light);
    }
}
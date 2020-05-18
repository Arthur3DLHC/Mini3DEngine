import { LightShadow } from "./lightShadow.js";
import { SpotLight } from "./spotLight.js";

export class SpotLightShadow extends LightShadow {
    public constructor(light: SpotLight) {
        super(light);
    }

    public updateShadowMatrices() {
        // todo: subclass update shadow matrices according to light pose and properties
        // throw new Error("Not implemented.");
    }
}
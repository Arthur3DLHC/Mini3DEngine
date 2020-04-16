import { BaseLight } from "./baseLight.js";
import { SpotLightShadow } from "./spotLightShadow.js";

export class SpotLight extends BaseLight {
    public constructor() {
        super();
        this.shadow = new SpotLightShadow(this);
    }
}
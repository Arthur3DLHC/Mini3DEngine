import { LightShadow } from "./lightShadow.js";
import { PointLight } from "./pointLight.js";

export class PointLightShadow extends LightShadow {
    public constructor(light: PointLight) {
        super(light);
    }

    public updateShadowMatrices() {
        // todo: check dirty
        if (! this._light.worldTransform.equals(this._light.worldTransformPrev)) {
            this.moved = true;
        }

        // todo: point light's frustum is not a view frustum, but a bouding box
    }
}
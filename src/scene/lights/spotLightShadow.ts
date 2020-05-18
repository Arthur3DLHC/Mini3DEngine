import { LightShadow } from "./lightShadow.js";
import { SpotLight } from "./spotLight.js";
import mat4 from "../../../lib/tsm/mat4.js";

export class SpotLightShadow extends LightShadow {
    public constructor(light: SpotLight) {
        super(light);
    }

    public updateShadowMatrices() {
        this._light.worldTransform.copy(this._matView);
        this._matView.inverse();

        const spotLight = this._light as SpotLight;
        this._matProj = mat4.perspective(spotLight.outerConeAngle * 2, 1, 0.01, spotLight.distance);
    }
}
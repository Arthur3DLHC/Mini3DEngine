import { LightShadow } from "./lightShadow.js";
import { SpotLight } from "./spotLight.js";
import mat4 from "../../../lib/tsm/mat4.js";

export class SpotLightShadow extends LightShadow {
    public constructor(light: SpotLight) {
        super(light);
        this.bias = -0.0005;
    }

    public updateShadowMatrices() {
        // todo: check dirty
        if (! this._light.worldTransform.equals(this._light.worldTransformPrev)) {
            this.moved = true;
        }
        this._light.worldTransform.copyTo(this._matView);
        this._matView.inverse();

        const spotLight = this._light as SpotLight;
        const matProj = mat4.perspective(Math.min(spotLight.outerConeAngle * 2, 3.10) * 180.0 / Math.PI, 1, 0.01, spotLight.range > 0 ? spotLight.range : 20);
        if (! matProj.equals(this._matProj)) {
            this.moved = true;
            matProj.copyTo(this._matProj);
        }
        if (this.moved) {
            const viewProj = new mat4();
            mat4.product(this._matProj, this._matView, viewProj);
            this.frustums[0].setFromProjectionMatrix(viewProj);
        }
    }
}
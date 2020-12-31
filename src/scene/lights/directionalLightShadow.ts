import { LightShadow } from "./lightShadow.js";
import { DirectionalLight } from "./directionalLight.js";
import mat4 from "../../../lib/tsm/mat4.js";

export class DirectionalLightShadow extends LightShadow {
    public constructor(light: DirectionalLight) {
        super(light);
        this.radius = 0;
        this.range = 20;
    }

    /**
     * the radius of the directional light shadow.
     * if zero, automatically use the light radius as shadow radius.
     */
    public radius: number;
    public range: number;

    public updateShadowMatrices() {
        // todo: check dirty
        if (! this._light.worldTransform.equals(this._light.worldTransformPrev)) {
            this.moved = true;
        }
        this._light.worldTransform.copyTo(this._matView);
        this._matView.inverse();

        const dirLight = this._light as DirectionalLight;
        let r = dirLight.radius;
        if (this.radius > 0) {
            r = this.radius;
        }
        let d = dirLight.range;
        if (this.range > 0) {
            d = this.range;
        }
        const matProj = mat4.orthographic(-r, r, -r, r, 0.01, d);
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
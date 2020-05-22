import { LightShadow } from "./lightShadow.js";
import { DirectionalLight } from "./directionalLight.js";
import mat4 from "../../../lib/tsm/mat4.js";

export class DirectionalLightShadow extends LightShadow {
    public constructor(light: DirectionalLight) {
        super(light);
        this.radius = 0;
        this.distance = 100;
    }

    /**
     * the radius of the directional light shadow.
     * if zero, automatically use the light radius as shadow radius.
     */
    public radius: number;
    public distance: number;

    public updateShadowMatrices() {
        // todo: check dirty
        if (! this._light.worldTransform.equals(this._light.worldTransformPrev)) {
            this.dirty = true;
        }
        this._light.worldTransform.copy(this._matView);
        this._matView.inverse();

        const dirLight = this._light as DirectionalLight;
        let r = dirLight.radius;
        if (this.radius > 0) {
            r = this.radius;
        }
        const matProj = mat4.orthographic(-r, r, -r, r, 0.01, this.distance > 0 ? this.distance : 20);
        if (! matProj.equals(this._matProj)) {
            this.dirty = true;
            matProj.copy(this._matProj);
        }
        if (this.dirty) {
            const viewProj = new mat4();
            mat4.product(this._matProj, this._matView, viewProj);
            this.frustum.setFromProjectionMatrix(viewProj);
        }
    }
}
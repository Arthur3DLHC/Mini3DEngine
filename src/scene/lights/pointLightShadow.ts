import { LightShadow } from "./lightShadow.js";
import { PointLight } from "./pointLight.js";
import { Frustum } from "../../math/frustum.js";
import vec4 from "../../../lib/tsm/vec4.js";
import mat4 from "../../../lib/tsm/mat4.js";
import { TextureCube } from "../../WebGLResources/textures/textureCube.js";

export class PointLightShadow extends LightShadow {
    public constructor(light: PointLight) {
        super(light);
        // already have 1 face, add rest 5
        for(let i = 0; i < 5; i++) {
            this.frustums.push(new Frustum());
            this.mapRects.push(new vec4([0, 0, this.mapSize.x, this.mapSize.y]));
        }
    }

    public updateShadowMatrices() {
        // todo: check dirty
        if (! this._light.worldTransform.equals(this._light.worldTransformPrev)) {
            this.moved = true;
        }

        // set projmatrix to a default 90 fov 1:1 projection matrix
        // it will be used when render item shadowmaps
        const pointLight = this._light as PointLight;
        // fix me: optimize: don't calc matrix every frame; only when properties changed;
        const matProj = mat4.perspective(90, 1, 0.01, pointLight.range > 0 ? pointLight.range : 100);
        if (! matProj.equals(this._matProj)) {
            this.moved = true;
            matProj.copyTo(this._matProj);
        }

        if (this.moved) {
            // todo: update point light's 6 frustums
            const matViewProj = mat4.identity.copyTo();
            const matView = mat4.identity.copyTo();
            
            for (let i = 0; i < 6; i++) {
                // calc viewproj matrix
                // 1. to light local space
                matView.fromTranslation(this._light.worldTransform.getTranslation().scale(-1));
                // 2. to light view space
                mat4.product(TextureCube.getFaceViewMatrix(i), matView, matView);
                // 3. project
                mat4.product(matProj, matView, matViewProj);
                this.frustums[i].setFromProjectionMatrix(matViewProj);
            }
        }
    }
}
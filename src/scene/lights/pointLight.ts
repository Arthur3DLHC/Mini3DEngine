import { BaseLight } from "./baseLight.js";
import { PointLightShadow } from "./pointLightShadow.js";
import { BufferGeometry } from "../../geometry/bufferGeometry.js";
import { RenderList } from "../../renderer/renderList.js";
import { LightType } from "./lightType.js";
import { BoundingSphere } from "../../math/boundingSphere.js";

export class PointLight extends BaseLight {
    public constructor() {
        super();
        this.range = 0;
        this.shadow = new PointLightShadow(this);
        this._debugGeometry = null;
    }

    public get type() : LightType {
        return LightType.Point;
    }

    /**
     * if 0, infinity; or the intensity will fade out to zero at the distance.
     */
    public range: number;

    private _debugGeometry: BufferGeometry | null;

    public provideRenderItem(renderList: RenderList) {
        // todo: 如果开启了调试绘制模式，则输出调试图元；
    }

    public get boundingSphere(): BoundingSphere {
        this.boundingSphere.radius = (this.range == 0 ? Infinity : this.range);
        return this._boundingSphere;
    }
}
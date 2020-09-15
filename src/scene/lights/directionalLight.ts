import { BaseLight } from "./baseLight.js";
import { DirectionalLightShadow } from "./directionalLightShadow.js";
import { BufferGeometry } from "../../geometry/bufferGeometry.js";
import { RenderList } from "../../renderer/renderList.js";
import { LightType } from "./lightType.js";
import { BoundingSphere } from "../../math/boundingSphere.js";

export class DirectionalLight extends BaseLight {
    public constructor() {
        super();
        this.radius = 10;
        this.range = 20;
        this.shadow = new DirectionalLightShadow(this);
        this._debugGeometry = null;
    }

    public get type() : LightType {
        return LightType.Directional;
    }

    /**
     * radius of the light cylinder.
     * if zero, use infinite radius; and this.shadow.radius will be used as shadow radius.
     */
    public radius: number;

    /**
     * range of the light. the height of the cylinder
     * if zero, use infinite range; and this.shadow.distance will be used as shadow distance
     */
    public range: number;

    private _debugGeometry: BufferGeometry | null;

    public provideRenderItem(renderList: RenderList) {
        // todo: 如果开启了调试绘制模式，则输出调试图元；
    }

    public get boundingSphere(): BoundingSphere {
        // Fix me: 平行光没有纵向范围
        // 在 shader 中也尚未实现 radius 的衰减和判断
        this.boundingSphere.radius = Infinity;
        return this._boundingSphere;
    }
}
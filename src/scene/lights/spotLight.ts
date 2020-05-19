import { BaseLight } from "./baseLight.js";
import { SpotLightShadow } from "./spotLightShadow.js";
import { BufferGeometry } from "../../geometry/bufferGeometry.js";
import { RenderList } from "../../renderer/renderList.js";
import { LightType } from "./lightType.js";

export class SpotLight extends BaseLight {
    public constructor() {
        super();
        this.outerConeAngle = Math.PI * 0.25;
        this.innerConeAngle = Math.PI * 0.2;
        this.distance = 0;
        this.shadow = new SpotLightShadow(this);
        this._debugGeometry = null;
    }

    public get type() : LightType {
        return LightType.Spot;
    }

    /**
     * the outer cone angle, in radians.
     */
    public outerConeAngle: number;

    /**
     * 半影区占比。范围：0 ~ 1。默认值：0 （无半影区）
     */
    public innerConeAngle: number;

    public distance: number;

    private _debugGeometry: BufferGeometry | null;

    public provideRenderItem(renderList: RenderList) {
        // todo: 如果开启了调试绘制模式，则输出调试图元；
    }
}
import { BaseLight } from "./baseLight.js";
import { DirectionalLightShadow } from "./directionalLightShadow.js";
import { BufferGeometry } from "../../geometry/bufferGeometry.js";
import { RenderList } from "../../renderer/renderList.js";
import { LightType } from "./lightType.js";

export class DirectionalLight extends BaseLight {
    public constructor() {
        super();
        this.radius = 0;
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

    private _debugGeometry: BufferGeometry | null;

    public provideRenderItem(renderList: RenderList) {
        // todo: 如果开启了调试绘制模式，则输出调试图元；
    }
}
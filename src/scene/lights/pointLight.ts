import { BaseLight } from "./baseLight.js";
import { PointLightShadow } from "./pointLightShadow.js";
import { BufferGeometry } from "../../geometry/bufferGeometry.js";
import { RenderList } from "../../renderer/renderList.js";

export class PointLight extends BaseLight {
    public constructor() {
        super();
        this.distance = 0;
        this.shadow = new PointLightShadow(this);
        this._debugGeometry = null;
    }

    /**
     * if 0, infinity; or the intensity will fade out to zero at the distance.
     */
    public distance: number;

    private _debugGeometry: BufferGeometry | null;

    public provideRenderItem(renderList: RenderList) {
        // todo: 如果开启了调试绘制模式，则输出调试图元；
    }
}
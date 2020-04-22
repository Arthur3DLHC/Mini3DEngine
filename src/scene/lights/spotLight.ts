import { BaseLight } from "./baseLight.js";
import { SpotLightShadow } from "./spotLightShadow.js";
import { BufferGeometry } from "../../geometry/bufferGeometry.js";
import { RenderList } from "../../renderer/renderList.js";

export class SpotLight extends BaseLight {
    public constructor() {
        super();
        this.angle = 60;
        this.penumbra = 0;
        this.shadow = new SpotLightShadow(this);
        this._debugGeometry = null;
    }

    /**
     * the whole cone angle, in degrees.
     */
    public angle: number;

    /**
     * 半影区占比。范围：0 ~ 1。默认值：0 （无半影区）
     */
    public penumbra: number;

    private _debugGeometry: BufferGeometry | null;

    public provideRenderItem(renderList: RenderList) {
        // todo: 如果开启了调试绘制模式，则输出调试图元；
    }
}
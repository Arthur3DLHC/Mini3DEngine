import { Camera } from "./camera.js";
import { RenderList } from "../../renderer/renderList.js";
import { BufferGeometry } from "../../geometry/bufferGeometry.js";

export class PerspectiveCamera extends Camera {
    public constructor() {
        super();
        this.fov = 60;
        this.near = 0.1;
        this.far = 2000;
        this.focus = 10;
        this.aspect = 1;

        this.debugDraw = false;

        this._frustumGeometry = null;
    }
    /**
     * vertical fov, in degrees.
     */
    public fov: number;
    public near: number;
    public far: number;
    public focus: number;
    public aspect: number;

    public debugDraw: boolean;

    private _frustumGeometry: BufferGeometry | null;

    public provideRenderItem(renderList: RenderList) {
        // todo: 如果开启了调试绘制模式，则输出一个视锥图元；
    }
}
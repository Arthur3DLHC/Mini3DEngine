import { Camera } from "./camera.js";
import { RenderList } from "../../renderer/renderList.js";
import { BufferGeometry } from "../../geometry/bufferGeometry.js";
import mat4 from "../../../lib/tsm/mat4.js";

export class PerspectiveCamera extends Camera {
    public constructor() {
        super();
        this.fov = 60;

        this.focus = 10;
        this.aspect = 1;

        this.debugDraw = false;

        this._frustumGeometry = null;
    }
    /**
     * vertical fov, in degrees.
     */
    public fov: number;

    public focus: number;
    public aspect: number;

    public debugDraw: boolean;

    private _frustumGeometry: BufferGeometry | null;

    public updateViewProjTransform() {
        super.updateViewProjTransform();
        this.projTransform = mat4.perspective(this.fov * Math.PI / 180.0, this.aspect, this.near, this.far); 
        // todo: 在这里更新视锥？
    }

    public provideRenderItem(renderList: RenderList) {
        // todo: 如果开启了调试绘制模式，则输出一个视锥图元；
    }

    public destroy() {
        // subclass release WebGL resources.
        if (this._frustumGeometry) {
            this._frustumGeometry.destroy();
            this._frustumGeometry = null;
        }
    }
}
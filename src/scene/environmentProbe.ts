import { Object3D } from "./object3D.js";
import { Texture2DArray } from "../WebGLResources/textures/texture2DArray.js";
import { BufferGeometry } from "../geometry/bufferGeometry.js";
import { RenderList } from "../renderer/renderList.js";
import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";

export class EnvironmentProbe extends Object3D {
    public constructor() {
        super();
        this.visibleDistance = 20;
        this.backgroundColor = new vec4([0, 0, 0, 1]);
        this.texture = null;
        this.textureIndex = 0;

        this.debugDraw = false;
        this._debugGeometry = null;
    }
    // the pose and location is defined by transform matrix.
    /**
     * the max visible distance of decal
     */
    public visibleDistance: number;

    public backgroundColor: vec4;

    // 在blender中用sphere定义EnvironmentProbe的位置和影响范围？
    // 使用统一的cubemap size？
    public get radius(): number {
        // todo: use world transform scaling
        // this.worldTransform.getScaling(this.scaling);
        return Math.max(this.scale.x, Math.max(this.scale.y, this.scale.z));
    }
    // private scaling: vec3 = new vec3([1,1,1]);

    /**
     * multiple cubemaps passed in shader by texture 2d array; cube texture array is not supported now by WebGL2.0
     */
    public texture: Texture2DArray | null;
    /**
     * start index of cube face texture in 2d texture array.
     */
    public textureIndex: number;

    public debugDraw: boolean;
    private _debugGeometry: BufferGeometry | null;

    public provideRenderItem(renderList: RenderList) {
        // todo: 如果开启了调试绘制模式，则输出调试图元；
    }
}
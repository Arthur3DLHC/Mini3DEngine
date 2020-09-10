import { Object3D } from "./object3D.js";
import { Texture2DArray } from "../WebGLResources/textures/texture2DArray.js";
import { BufferGeometry } from "../geometry/bufferGeometry.js";
import { RenderList } from "../renderer/renderList.js";
import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";
import { BoxWireframeGeometry } from "../geometry/common/boxWireframeGeometry.js";
import { Material } from "./materials/material.js";
import { StandardPBRMaterial } from "./materials/standardPBRMaterial.js";

export class EnvironmentProbe extends Object3D {
    public constructor() {
        super();
        this.visibleDistance = 20;
        this.clippingStart = 0.01;
        this.clippingEnd = 20;
        this.backgroundColor = new vec4([0, 0, 0, 1]);
        this.texture = null;
        this.textureIndex = 0;

        this.debugDraw = false;
    }
    // the pose and location is defined by transform matrix.
    /**
     * the max visible distance of decal
     */
    public visibleDistance: number;

    public backgroundColor: vec4;

    public clippingStart: number;
    public clippingEnd: number;

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
    private static _debugGeometry: BufferGeometry | null = null;
    private static _debugMaterial: Material | null = null;

    public provideRenderItem(renderList: RenderList) {
        // todo: 如果开启了调试绘制模式，则输出调试图元；
        if(this.debugDraw) {
            if (EnvironmentProbe._debugGeometry === null) {
                EnvironmentProbe._debugGeometry = new BoxWireframeGeometry(0.1, 0.1, 0.1);
            }
            if (EnvironmentProbe._debugMaterial === null) {
                const stdMtl = new StandardPBRMaterial();
                stdMtl.color.rgba = [0, 0, 0, 1];
                stdMtl.emissive.rgba = [0, 1, 0, 1];

                EnvironmentProbe._debugMaterial = stdMtl;
            }
            renderList.addRenderItem(this, EnvironmentProbe._debugGeometry, 0, Infinity, EnvironmentProbe._debugMaterial);
        }
    }
}
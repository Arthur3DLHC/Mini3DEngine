import { Object3D } from "./object3D.js";
import { Texture2DArray } from "../WebGLResources/textures/texture2DArray.js";
import { BufferGeometry } from "../geometry/bufferGeometry.js";
import { RenderList } from "../renderer/renderList.js";
import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";
import { BoxWireframeGeometry } from "../geometry/common/boxWireframeGeometry.js";
import { Material } from "./materials/material.js";
import { StandardPBRMaterial } from "./materials/standardPBRMaterial.js";

export enum EnvironmentProbeType {
    Reflection,
    Irradiance,
}

export class EnvironmentProbe extends Object3D {
    public constructor() {
        super();
        this.probeType = EnvironmentProbeType.Reflection;
        this.visibleDistance = 10;
        this.localRange = new vec3([1,1,1]);
        this.clippingStart = 0.01;
        this.clippingEnd = 20;
        this.backgroundColor = new vec4([0, 0, 0, 1]);
        this.texture = null;
        this.textureIndex = 0;

        this.debugDraw = false;
    }

    public probeType: EnvironmentProbeType;

    // the pose and location is defined by transform matrix.
    /**
     * the max visible distance from camera to probe.
     * only work for reflection probes. (not for irradiace probes)
     */
    public visibleDistance: number;

    /**
     * 'influence distance' in blender
     * the final influence distance will be calculated by range * scale of this node
     */
    public localRange: vec3;

    public backgroundColor: vec4;

    public clippingStart: number;
    public clippingEnd: number;

    /**
     * world transform scaling x range, as in blender?
     * pixels out of the radius will not receive the indirect lighting from this probe?
     * if overlapped, the smaller the radius and distance, the more influence;
     */
    public get radius(): number {
        // fix me: if not changed, should not get every frame
        // fortunately, this prop will only accessed once when change the scene.
        if (this._radius < 0) {
            this.worldTransform.getScaling(EnvironmentProbe._tmpScale);
            this._radius = Math.max(EnvironmentProbe._tmpScale.x * this.localRange.x, Math.max(EnvironmentProbe._tmpScale.y * this.localRange.y, EnvironmentProbe._tmpScale.z * this.localRange.z));
        }
       return this._radius;
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

    /**
     * cached global radius for pass in ubo and cluster-sphere culling
     */
    private _radius: number = -1;
    private static _debugGeometry: BufferGeometry | null = null;
    private static _debugMaterial: Material | null = null;
    private static _tmpScale: vec3 = new vec3();

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
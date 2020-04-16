import { Object3D } from "./object3D.js";
import { Texture2DArray } from "../WebGLResources/textures/texture2DArray.js";

export class EnvironmentProbe extends Object3D {
    public constructor() {
        super();
        this.texture = null;
        this.textureIndex = 0;
    }
    // the pose and location is defined by transform matrix.

    // 在blender中用sphere定义EnvironmentProbe的位置和影响范围？
    // 使用统一的cubemap size？

    /**
     * multiple cubemaps passed in shader by texture 2d array; cube texture array is not supported now by WebGL2.0
     */
    public texture: Texture2DArray | null;
    /**
     * start index of cube face texture in 2d texture array.
     */
    public textureIndex: number;
}
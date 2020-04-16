import { Object3D } from "./object3D.js";
import { Texture3D } from "../WebGLResources/textures/texture3D.js";
import { BoundingBox } from "../math/boundingBox.js";
import { vec3 } from "gl-matrix";

export class IrradianceVolume extends Object3D {
    public constructor() {
        super();
        this.shTextures = [];
        this.atlasLocation = new BoundingBox(vec3.fromValues(0, 0, 0), vec3.fromValues(8, 8, 8));
    }

    // pose, position and range are defined by transform matrix.

    // use boxex as agent of irradiance volume objects in blender, and export them through glTF.
    // use custom properties to record row, col and layers of probes.
    // or, can I export blender irradiance volume object info to glTF directly?

    // 4 basis sh
    // rgb value in one texture
    // 4 textures for 4 basis?
    // look into sourcecode of blender and learn how to storage.

    // use a 3d texture atlas? or 2d texture atlas?
    // use 3D Bin packing algorisms?
    public shTextures: Texture3D[];

    public atlasLocation: BoundingBox;
}
import { Mesh } from "./mesh.js";
import { Object3D } from "./object3D.js";
import mat4 from "../../lib/tsm/mat4.js";

export class SkinMesh extends Mesh {
    public joints: Object3D[] = [];
    public jointMatrices: mat4[] = [];

    // todo: bind pose matrices, should be cached?
    public inverseBindMatrices: mat4[] = [];

    public updateJointMatrices(){
        for(let i = 0; i < this.joints.length; i++) {
            const joint = this.joints[i];
            let ibm = this.inverseBindMatrices[i];
            let jointMatrix = this.jointMatrices[i];
            mat4.product(joint.worldTransform, ibm, jointMatrix);
            // do not need to multiply with the inv world matrix of parent node,
            // as https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/master/src/skin.js do,
            // because we do not multiply the world matrix of parent node in shader.
        }
    }
}
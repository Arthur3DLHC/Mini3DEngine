import { Mesh } from "./mesh.js";
import { Object3D } from "./object3D.js";
import mat4 from "../../lib/tsm/mat4.js";

export class SkinMesh extends Mesh {
    public joints: Object3D[] = [];
    public jointMatrices: mat4[] = [];

    // todo: bind pose matrices, should be cached?
    public bindPoseMatrices: mat4[] = [];

    public updateJointMatrices(){

    }
}
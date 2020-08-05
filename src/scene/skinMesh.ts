import { Mesh } from "./mesh.js";
import { Object3D } from "./object3D.js";

export class SkinMesh extends Mesh {
    public joints: Object3D[] = [];
}
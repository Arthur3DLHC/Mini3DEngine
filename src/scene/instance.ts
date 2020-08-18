import { Object3D } from "./object3D.js";
import { InstancedMesh } from "./instancedMesh.js";

export class Instance extends Object3D {
    public constructor(mesh: InstancedMesh) {
        super();
        this.mesh = mesh;
    }
    public mesh: InstancedMesh;

    // fix me: how to update mesh instance matrices after world transform updated?
    // if this instance is static, update only once while building the scene
    // if not, update every time moved?
    // how to hide invisible instances? use all zero to indicate?
    // while instance is moved or show/hide, set a 'instanceDirty' flag on instancedMesh?

    // how to do the frustum culling for instanced mesh? or do not need to do that?
}
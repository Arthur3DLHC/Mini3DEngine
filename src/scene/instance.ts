import { Object3D } from "./object3D.js";
import { InstancedMesh } from "./instancedMesh.js";

export class Instance extends Object3D {
/**
 * 
 * @param mesh instanced mesh this instance belongs to
 * @param index instance (matrix) index
 */
    public constructor(mesh: InstancedMesh, index: number) {
        super();
        this.mesh = mesh;
        this._index = index;
    }
    public mesh: InstancedMesh;

    private _index: number;

    // fix me: how to update mesh instance matrices after world transform updated?
    // if this instance is static, update only once while building the scene
    // if not, update every time moved?
    // how to hide invisible instances? use all zero matrix and color to indicate?
    // while instance is moved or show/hide, set a 'instanceDirty' flag on instancedMesh?

    protected onWorldTransformUpdated() {
        if (this.moved) {
            this.mesh.setMatrixOf(this._index, this.worldTransform);
        }
    }

    // how to do the frustum culling for instanced mesh? or do not need to do that?
}
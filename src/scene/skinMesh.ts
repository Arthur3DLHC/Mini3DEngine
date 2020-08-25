import { Mesh } from "./mesh.js";
import { Object3D } from "./object3D.js";
import mat4 from "../../lib/tsm/mat4.js";
import { BoundingSphere } from "../mini3DEngine.js";

export class SkinMesh extends Mesh {
    public joints: Object3D[] = [];
    public jointMatrices: mat4[] = [];

    // todo: bind pose matrices, should be cached?
    public inverseBindMatrices: mat4[] = [];

    private _boundingSphere: BoundingSphere = new BoundingSphere();

    /**
     * the entire bounding sphere
     */
    public get boundingSphere(): BoundingSphere | null {
        return this._boundingSphere;
    }

    public updateJointMatrices(){
        // todo: apply joint transform to geometry bounding sphere then enlarge total bounding sphere?
        if (this.geometry) {
            const geomSphere = this.geometry.boundingSphere
            this._boundingSphere.center = geomSphere.center;
            this._boundingSphere.radius = geomSphere.radius;

            const geomWorldSphere = new BoundingSphere();

            for (let i = 0; i < this.joints.length; i++) {
                const joint = this.joints[i];
                let ibm = this.inverseBindMatrices[i];
                mat4.product(joint.worldTransform, ibm, this.jointMatrices[i]);
                // do not need to multiply with the inv world matrix of parent node,
                // as https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/master/src/skin.js do,
                // because we do not multiply the world matrix of parent node in shader.

                // enlarge boundingsphere
                geomSphere.transform(joint.worldTransform, geomWorldSphere);
                this._boundingSphere.enlarge(geomWorldSphere);
            }
        }
    }

    public static updateSkinMeshes(obj: Object3D) {
        if (obj instanceof SkinMesh) {
            const skinMesh = obj as SkinMesh;
            skinMesh.updateJointMatrices();
        }

        for (const child of obj.children) {
            SkinMesh.updateSkinMeshes(child);
        }
    }
}
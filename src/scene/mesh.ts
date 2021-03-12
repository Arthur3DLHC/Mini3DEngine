import { Object3D } from "./object3D.js";
import { Material } from "./materials/material.js";
import { BufferGeometry } from "../geometry/bufferGeometry.js";
import { RenderList } from "../renderer/renderList.js";
import { BoundingSphere } from "../math/boundingSphere.js";
import { BoundingBox } from "../math/boundingBox.js";
import mat4 from "../../lib/tsm/mat4.js";

export class Mesh extends Object3D {
    public constructor() {
        super();
        this.geometry = null;
        this.materials = [];
    }
    // todo: geometry? 
    public geometry: BufferGeometry | null;
    // todo: material list
    public materials: Material[];

    protected _boundingSphere: BoundingSphere = new BoundingSphere();

    /**
     * the entire bounding sphere, in world space
     * this is useful for frustum culling
     */
    public get boundingSphere(): BoundingSphere {
        if (this.geometry === null) {
            return this._boundingSphere;
        }
        this.geometry.boundingSphere.transform(this.worldTransform, this._boundingSphere);
        return this._boundingSphere;
    }

    /**
     * get entire bounding box, int world space
     * this will be used in occlusion query
     * @param bbox output local axis aligned bounding box of this object
     * @param worldTransform output world transform matrix of the bounding box
     */
    public getBoundingBox(bbox: BoundingBox, worldTransform: mat4) {
        if (this.geometry !== null) {
            this.geometry.boundingBox.minPoint.copyTo(bbox.minPoint);
            this.geometry.boundingBox.maxPoint.copyTo(bbox.maxPoint);
        }
        this.worldTransform.copyTo(worldTransform);
    }

    public provideRenderItem(renderList: RenderList) {
        if (this.geometry) {
            if (this.geometry.primitives) {
                for (const grp of this.geometry.primitives) {
                    renderList.addRenderItem(this, this.geometry, grp.start, grp.count, this.getMaterial(grp.materialId));
                }
            } else {
                renderList.addRenderItem(this, this.geometry, 0, Infinity, this.getMaterial(0));
            }
        }
    }

    public getMaterial(index: number): Material|null {
        if (this.materials.length > 0) {
            return this.materials[Math.min(this.materials.length - 1, index)];
        }
        return null;
    }
}
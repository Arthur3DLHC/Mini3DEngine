import { Object3D } from "./object3D.js";
import { RenderItem } from "../renderer/renderItem.js";
import { Material } from "./materials/material.js";
import { BufferGeometry } from "../geometry/bufferGeometry.js";
import { RenderList } from "../renderer/renderList.js";

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

    public provideRenderItem(renderList: RenderList) {
        if (this.geometry) {
            if (this.geometry.groups) {
                for (const grp of this.geometry.groups) {
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
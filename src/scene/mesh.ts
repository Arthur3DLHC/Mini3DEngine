import { Object3D } from "./object3D.js";
import { RenderItem } from "../renderer/renderItem.js";
import { Material } from "./materials/material.js";
import { BufferGeometry } from "../geometry/bufferGeometry.js";

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

    public provideRenderItem(itemList: RenderItem[]) {
        if (this.geometry) {
            if (this.geometry.groups) {
                for (const grp of this.geometry.groups) {
                    const newItem = new RenderItem();
                    newItem.geometry = this.geometry;
                    newItem.startIndex = grp.start;
                    newItem.count = grp.count;
                    newItem.material = this.materials[Math.min(this.materials.length - 1, grp.materialId)];
                    // todo: other properties: draw order, layer, ...
                    itemList.push(newItem);
                }
            } else {
                const newItem = new RenderItem();
                newItem.geometry = this.geometry;
                if (this.materials.length > 0) {
                    newItem.material = this.materials[0];
                }
                // todo: other properties: draw order, layer, ...
                itemList.push(newItem);
            }
        }
    }
}
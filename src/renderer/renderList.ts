import { RenderItem } from "./renderItem.js";
import { Object3D } from "../scene/object3D.js";
import { BufferGeometry } from "../geometry/bufferGeometry.js";
import { Material } from "../scene/materials/material.js";
import vec3 from "../../lib/tsm/vec3.js";

export class RenderList {

    private items: RenderItem[];
    private curItemIndex: number;

    public constructor() {
        this.items = [];
        this.curItemIndex = 0;
    }

    public get ItemCount(): number {
        return this.curItemIndex;
    }

    public getItemAt(index: number): RenderItem | null {
        if(index >= 0 && index < this.curItemIndex) {
            return this.items[index];
        }
        return null;
    }

    // list of renderItems
    public addRenderItem(object: Object3D, geometry: BufferGeometry, startIdx: number, count: number, material: Material|null) {
        let item: RenderItem | null = null;
        // reuse exist renderItem object; don't always new objects
        if (this.curItemIndex < this.items.length) {
            item = this.items[this.curItemIndex];
            item.object = object;
            item.geometry = geometry;
            item.startIndex = startIdx;
            item.count = count;
            item.material = material;
        } else {
            item = new RenderItem(object, geometry, material, startIdx, count);
            // javascript 似乎可以自动根据索引分配空间，所以不用调 push
            // this.items.push(item);
            this.items[this.curItemIndex] = item;
        }
        this.curItemIndex++;
    }

    public clear() {
        this.curItemIndex = 0;
    }

    public sortFarToNear(cameraPosition: vec3) {
        const objPosition: vec3 = new vec3();
        this.sort((a:RenderItem, b:RenderItem) => {
            a.object.worldTransform.getTranslation(objPosition);
            objPosition.subtract(cameraPosition);
            const distA = objPosition.squaredLength();
            b.object.worldTransform.getTranslation(objPosition);
            objPosition.subtract(cameraPosition);
            const distB = objPosition.squaredLength();
            return distA < distB ? 1 : -1;
        });
    }

    public sort(compareFn?: (a: RenderItem, b: RenderItem) => number) {
        // todo: how to limit the count?
        this.items.length = this.curItemIndex;  // will this causing memory realloc?
        this.items.sort(compareFn);
    }
}
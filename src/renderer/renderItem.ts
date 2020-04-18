import { BufferGeometry } from "../geometry/bufferGeometry.js";
import { Material } from "../scene/materials/material.js";
import { Object3D } from "../scene/object3D.js";

/**
 * The smallest unit for render.
 */
export class RenderItem {
    public constructor(object: Object3D, geometry: BufferGeometry, material: Material|null, startIndex: number, count: number) {
        this.object = object;
        this.geometry = geometry;
        this.material = material;
        this.startIndex = 0;
        this.count = Infinity;
    }
    // object, for getting transform matrix
    public object: Object3D;

    // todo: define primitive type?

    // geometry
    public geometry : BufferGeometry;

    // draw range?
    public startIndex: number;
    public count: number;

    // material
    public material : Material|null;
    // program, whether from material or renderer specific
    // render order and grouping
}
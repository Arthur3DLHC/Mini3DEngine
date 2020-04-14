import { BufferGeometry } from "../geometry/bufferGeometry.js";
import { Material } from "../scene/materials/material.js";

/**
 * The smallest unit for render.
 */
export class RenderItem {
    public constructor() {
        this.geometry = null;
        this.material = null;
        this.startIndex = 0;
        this.count = Infinity;
    }
    // geometry
    
    public geometry : BufferGeometry | null;

    // draw range?
    public startIndex: number;
    public count: number;

    // material
    public material : Material | null;
    // program, whether from material or renderer specific
    // render order and grouping
}
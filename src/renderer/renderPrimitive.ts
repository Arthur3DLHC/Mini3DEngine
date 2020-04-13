import { BufferGeometry } from "../geometry/bufferGeometry.js";
import { Material } from "../scene/materials/material.js";

/**
 * The smallest unit for render.
 */
export class RenderPrimitive {
    public constructor() {
        this.geometry = null;
        this.material = null;
    }
    // geometry
    
    public geometry : BufferGeometry | null;
    
    // material
    public material : Material | null;
    // program, whether from material or renderer specific
    // render order and grouping
}
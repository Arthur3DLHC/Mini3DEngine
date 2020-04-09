import { BufferGeometry } from "../geometry/bufferGeometry.js";

/**
 * The smallest unit for render.
 */
export class RenderPrimitive {
    public constructor() {
        this.geometry = null;
    }
    // geometry
    
    public geometry : BufferGeometry | null;
    
    // material
    // program, whether from material or renderer specific
    // render order and grouping
}
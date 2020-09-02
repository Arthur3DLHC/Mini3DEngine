import { BoundingBox } from "../math/boundingBox.js";

/**
 * one cluster cell in cluster grid
 */
export class Cluster {
    public i: number = 0;
    public j: number = 0;
    public k: number = 0;
    /**
     * axis aligned bounding box in view space
     */
    public boudingBox: BoundingBox = new BoundingBox();

    // item idx list
    public lights: number[] = [];
    public decals: number[] = [];
    public envProbes: number[] = [];

    public clear() {
        this.lights.length = 0;
        this.decals.length = 0;
        this.envProbes.length = 0;
    }
}
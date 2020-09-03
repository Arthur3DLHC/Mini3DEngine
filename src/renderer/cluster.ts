import { BoundingBox } from "../math/boundingBox.js";

/**
 * one cluster cell in cluster grid
 */
export class Cluster {
    public constructor(i: number, j: number, k: number) {
        this.i = i; this.j = j; this.k = k;
    }
    public i: number;
    public j: number;
    public k: number;
    /**
     * axis aligned bounding box in view space
     */
    public boudingBox: BoundingBox = new BoundingBox();

    // item idx list
    // todo: use Uint32Array to faster?
    public lights: number[] = [];
    public decals: number[] = [];
    public envProbes: number[] = [];

    public clear() {
        this.lights.length = 0;
        this.decals.length = 0;
        this.envProbes.length = 0;
    }
}
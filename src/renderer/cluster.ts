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
    public boundingBox: BoundingBox = new BoundingBox();

    // item idx list
    // todo: use Uint32Array to faster?
    private _lights: number[] = [];
    private _decals: number[] = [];
    private _reflProbes: number[] = [];
    private _irrProbes: number[] = [];

    private _lightCount: number = 0;
    private _decalCount: number = 0;
    private _reflProbeCount: number = 0;
    private _irrProbeCount: number = 0;

    public get lightCount() { return this._lightCount;}
    public get decalCount() { return this._decalCount;}
    public get reflProbeCount() { return this._reflProbeCount;}
    public get irrProbeCount() { return this._irrProbeCount;}

    public getLight(idx: number): number { return this._lights[idx]; }
    public getDecal(idx: number): number { return this._decals[idx]; }
    public getReflProbe(idx: number): number {return this._reflProbes[idx];}
    public getIrrProbe(idx: number): number {return this._irrProbes[idx];}

    public clear() {
        // this._lights.length = 0;
        // this._decals.length = 0;
        // this._reflProbes.length = 0;
        // this._irrProbes.length = 0;
        this._lightCount = 0;
        this._decalCount = 0;
        this._reflProbeCount = 0;
        this._irrProbeCount = 0;
    }

    public addLight(lightIdx: number) {
        // this._lights.push(lightIdx);
        this._lights[this._lightCount] = lightIdx;
        this._lightCount++;
    }

    public addDecal(decalIdx: number) {
        // this._decals.push(decalIdx);
        this._decals[this._decalCount] = decalIdx;
        this._decalCount++;
    }

    public addReflectionProbe(reflIdx: number) {
        // this._reflProbes.push(reflIdx);
        this._reflProbes[this._reflProbeCount] = reflIdx;
        this._reflProbeCount++;
    }

    public addIrradianceProbe(irrIdx: number) {
        // this._irrProbes.push(irrIdx);
        this._irrProbes[this._irrProbeCount] = irrIdx;
        this._irrProbeCount++;
    }
}
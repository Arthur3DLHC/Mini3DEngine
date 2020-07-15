/**
 * WebGL primitve
 */
export class Primitive {
    public constructor(start: number = 0, count: number = Infinity, materialId: number = 0) {
        this.start = start;
        this.count = count;
        this.materialId = materialId;
    }
    public start: number;
    public count: number;
    public materialId: number;
}
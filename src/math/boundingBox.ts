import { vec3 } from "gl-matrix";

export class BoundingBox {
    public constructor(minPt: vec3|null, maxPt: vec3|null) {
        this.minPoint = vec3.fromValues(-Infinity, -Infinity, -Infinity);
        this.maxPoint = vec3.fromValues(Infinity, Infinity, Infinity);
        if (minPt) {
            vec3.copy(this.minPoint, minPt);
        }
        if (maxPt) {
            vec3.copy(this.maxPoint, maxPt);
        }
    }
    public minPoint: vec3;
    public maxPoint: vec3;
}
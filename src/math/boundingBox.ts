import vec3 from "../../lib/tsm/vec3.js"

/**
 * from three.js: box.js
 */
export class BoundingBox {
    public constructor(minPt: vec3|null, maxPt: vec3|null) {
        this.minPoint = new vec3([-Infinity, -Infinity, -Infinity]);
        this.maxPoint = new vec3([Infinity, Infinity, Infinity]);
        if (minPt) {
            minPt.copy(this.minPoint);
        }
        if (maxPt) {
            maxPt.copy(this.maxPoint);
        }
    }
    public minPoint: vec3;
    public maxPoint: vec3;
}
import vec3 from "../../lib/tsm/vec3.js"

/**
 * from three.js: box.js
 */
export class BoundingBox {
    public constructor(minPt?: vec3, maxPt?: vec3) {
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

    public get center(): vec3 {
        return vec3.sum(this.minPoint, this.maxPoint).scale(0.5);
    }

    public expandByPoint(point: vec3): BoundingBox {
        vec3.componentsMin(this.minPoint, point, this.minPoint);
        vec3.componentsMax(this.maxPoint, point, this.maxPoint);
        return this;
    }
}
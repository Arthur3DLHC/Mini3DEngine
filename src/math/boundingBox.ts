import vec3 from "../../lib/tsm/vec3.js"
import { BoundingSphere } from "./boundingSphere.js";

/**
 * from three.js: box.js
 */
export class BoundingBox {

    public constructor(minPt?: vec3, maxPt?: vec3) {
        this.minPoint = new vec3([Infinity, Infinity, Infinity]);
        this.maxPoint = new vec3([-Infinity, -Infinity, -Infinity]);
        if (minPt) {
            minPt.copyTo(this.minPoint);
        }
        if (maxPt) {
            maxPt.copyTo(this.maxPoint);
        }
    }
    public minPoint: vec3;
    public maxPoint: vec3;

    public get center(): vec3 {
        return vec3.sum(this.minPoint, this.maxPoint).scale(0.5);
    }

    public reset() {
        this.minPoint = new vec3([Infinity, Infinity, Infinity]);
        this.maxPoint = new vec3([-Infinity, -Infinity, -Infinity]);
    }

    public expandByPoint(point: vec3): BoundingBox {
        vec3.componentsMin(this.minPoint, point, this.minPoint);
        vec3.componentsMax(this.maxPoint, point, this.maxPoint);
        return this;
    }

    public intersectSphere(sphere: BoundingSphere): boolean {
        let dmin = 0;
        const c = sphere.center;
        for (let i = 0; i < 3; i++) {
            if(c.at(i) < this.minPoint.at(i)) {
                const offset = c.at(i) - this.minPoint.at(i);
                dmin += offset * offset;
            } else if (c.at(i) > this.maxPoint.at(i)) {
                const offset = c.at(i) - this.maxPoint.at(i);
                dmin += offset * offset;
            }
        }
        return dmin <= sphere.radius * sphere.radius;
    }
}
import vec3 from "../../lib/tsm/vec3.js";
import mat4 from "../../lib/tsm/mat4.js";

/**
 * from three.js: sphere.js
 */
export class BoundingSphere {

    public constructor(center: vec3 = vec3.zero, radius: number = 0) {
        this.center = center.copy();
        this.radius = radius;
    }

    public copyFrom(other: BoundingSphere): BoundingSphere {
        other.center.copy(this.center);
        this.radius = other.radius;
        return this;
    }

    public center: vec3;
    public radius: number;

    public transform(matrix: mat4, result?: BoundingSphere): BoundingSphere {
        if (!result) {
            result = new BoundingSphere();
        }

        result.center = matrix.multiplyVec3(this.center);
        const scaling = new vec3();
        matrix.getScaling(scaling);
        const maxScaling = Math.max(scaling.x, Math.max(scaling.y, scaling.z));
        result.radius = this.radius * maxScaling;

        return result;
    }

    /**
     * enlarge this bounding sphere to contain another one
     * @param sphere bounding sphere to contain
     */
    enlarge(sphere: BoundingSphere) {
        // center may change
        // from this center to new sphere center
        const offset: vec3 = sphere.center.copy()
        offset.subtract(this.center);
        const dist: number = offset.length();
        const r1 = this.radius;
        const r2 = sphere.radius;
        if (dist + r2 <= r1) { //contains, no need to change
            return;
        }
        if (dist + r1 <= r2) {
            this.radius = r2;
            sphere.center.copy(this.center);
            return;
        }
        let d = dist + r1 + r2;
        // d = Math.max(d, Math.max(this.radius, sphere.radius));
        const newRadius = d * 0.5;
        // calculate new center
        const distToNewCenter: number = r2 + dist - newRadius; // the last is new radius
        const s: number = distToNewCenter / dist;
        this.center.add(offset.scale(s));
        this.radius = newRadius;
    }
}
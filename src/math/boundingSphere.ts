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

    enlarge(sphere: BoundingSphere) {
        // center may change
        // from this center to new sphere center
        const offset: vec3 = sphere.center.copy()
        offset.subtract(this.center);
        const dist: number = offset.length();
        if (dist < 0.0001) {    // almost same center, no need to move
            this.radius = Math.max(this.radius, sphere.radius);
            return;
        }
        let d = dist + this.radius + sphere.radius;
        d = Math.max(d, Math.max(this.radius, sphere.radius));
        const newRadius = d * 0.5;
        // calculate new center
        const distToNewCenter: number = sphere.radius + dist - newRadius; // the last is new radius
        const s: number = distToNewCenter / dist;
        this.center.add(offset.scale(s));
        this.radius = newRadius;
    }
}
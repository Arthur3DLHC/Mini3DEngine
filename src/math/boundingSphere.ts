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
}
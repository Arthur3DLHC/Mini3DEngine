import vec3 from "../../lib/tsm/vec3.js";

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
}
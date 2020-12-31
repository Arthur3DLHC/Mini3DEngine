import vec3 from "../../lib/tsm/vec3.js";
import { BoundingSphere } from "./boundingSphere.js";
import mat4 from "../../lib/tsm/mat4.js";

export class Plane {
    public constructor(a: number = 0, b: number = 0, c: number = 0, d: number = 0) {
        this.normal = new vec3([a, b, c]);
        this.constant = d;
    }

    public normal: vec3;
    public constant: number;

    private static _tmpMatrix: mat4 = new mat4();

    public copy(): Plane {
        return new Plane(this.normal.x, this.normal.y, this.normal.z, this.constant);
    }

    public setComponents(x: number, y: number, z: number, w: number): Plane {
        this.normal.x = x;
        this.normal.y = y;
        this.normal.z = z;
		this.constant = w;

        return this;
    }

    public setFromPoints(point1: vec3, point2: vec3, point3: vec3): Plane {
        // from babylon.js, and do not sure whether is same with three.js yet
        var x1 = point2.x - point1.x;
        var y1 = point2.y - point1.y;
        var z1 = point2.z - point1.z;
        var x2 = point3.x - point1.x;
        var y2 = point3.y - point1.y;
        var z2 = point3.z - point1.z;
        var yz = (y1 * z2) - (z1 * y2);
        var xz = (z1 * x2) - (x1 * z2);
        var xy = (x1 * y2) - (y1 * x2);
        var pyth = (Math.sqrt((yz * yz) + (xz * xz) + (xy * xy)));
        var invPyth;

        if (pyth !== 0) {
            invPyth = 1.0 / pyth;
        }
        else {
            invPyth = 0.0;
        }

        this.normal.x = yz * invPyth;
        this.normal.y = xz * invPyth;
        this.normal.z = xy * invPyth;
        this.constant = -((this.normal.x * point1.x) + (this.normal.y * point1.y) + (this.normal.z * point1.z));

        return this;
    }

    public setFromNormalAndPoint(normal: vec3, point: vec3): Plane {
        this.normal = normal.copyTo();
        this.normal.normalize();
        this.constant = - vec3.dot( this.normal, point );
        return this;
    }

    public normalize(): Plane {
        // from babylon.js
        var norm = (Math.sqrt((this.normal.x * this.normal.x) + (this.normal.y * this.normal.y) + (this.normal.z * this.normal.z)));
        var magnitude = 0.0;

        if (norm !== 0) {
            magnitude = 1.0 / norm;
        }
        this.normal.x *= magnitude;
        this.normal.y *= magnitude;
        this.normal.z *= magnitude;
        this.constant *= magnitude;
        return this;
    }

    public negate(): Plane {
        this.normal.negate();
        this.constant *= -1;
        return this;
    }

    public distanceToPoint(point: vec3): number {
        return vec3.dot(this.normal, point) + this.constant;
    }

    public distanceToSphere(sphere: BoundingSphere): number {
        return this.distanceToPoint(sphere.center) - sphere.radius;
    }

    public transform(transformation: mat4): Plane {
        // multiply inverse transform matrix
        // https://stackoverflow.com/questions/7685495/transforming-a-3d-plane-using-a-4x4-matrix
        // https://github.com/BabylonJS/Babylon.js/blob/master/src/Maths/math.plane.ts
        
        // inverse
        const inversedMatrix = Plane._tmpMatrix;
        transformation.copyTo(inversedMatrix);
        inversedMatrix.inverse();
        const m = inversedMatrix.values;
        const x = this.normal.x;
        const y = this.normal.y;
        const z = this.normal.z;
        const d = this.constant;
        // transpose
        this.normal.x = x * m[0] + y * m[1] + z * m[2] + d * m[3];
        this.normal.y = x * m[4] + y * m[5] + z * m[6] + d * m[7];
        this.normal.z = x * m[8] + y * m[9] + z * m[10] + d * m[11];
        this.constant = x * m[12] + y * m[13] + z * m[14] + d * m[15];

        return this;
    }

    public static fromPoints(p1: vec3, p2: vec3, p3: vec3): Plane {
        const result = new Plane(0, 0, 0, 0);
        result.setFromPoints(p1, p2, p3);
        return result;
    }

    public static fromNormalAndPoint(normal: vec3, point: vec3): Plane {
        // normal.normalize();
        // const d = - vec3.dot( normal, point );
        // return new Plane(normal.x, normal.y, normal.z, d);
        return new Plane().setFromNormalAndPoint(normal, point);
    }
}
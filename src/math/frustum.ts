import { BoundingBox } from "./boundingBox.js";
import { BoundingSphere } from "./boundingSphere.js";
import mat4 from "../../lib/tsm/mat4.js";
import vec3 from "../../lib/tsm/vec3.js";
import { Plane } from "./plane.js";

/**
 * frustum for cull objects
 */
export class Frustum {
    public constructor() {
        this.planes = [
            new Plane(),
            new Plane(),
            new Plane(),
            new Plane(),
            new Plane(),
            new Plane(),
        ];
    }

    /**
     * could be 5 or 6 planes
     * 5 for light frustum; can speed up test (1 less plane)
     */
    public planes: Plane[];

    /**
     * a vector to prevent new object everytime.
     */
    private static _tmpVector: vec3 = new vec3();

    public intersectsSphere(sphere: BoundingSphere): boolean {
        const center = sphere.center;
        const negRadius = -sphere.radius;

        for (let i = 0; i < this.planes.length; i++) {

            const dist = this.planes[i].distanceToPoint(center);
            
            if (dist < negRadius) {
                return false;
            }
        }
        return true;
    }

    public intersectsBox(box: BoundingBox): boolean {
        for (let i = 0; i < this.planes.length; i++) {
            const plane = this.planes[i];
			// corner at max distance
            Frustum._tmpVector.x = plane.normal.x > 0 ? box.maxPoint.x : box.minPoint.x;
            Frustum._tmpVector.y = plane.normal.y > 0 ? box.maxPoint.y : box.minPoint.y;           
            Frustum._tmpVector.z = plane.normal.z > 0 ? box.maxPoint.z : box.minPoint.z;
            
            if (plane.distanceToPoint(Frustum._tmpVector) < 0) {
                return false;
            }
        }
        return true;
    }

    public containsPoint(point: vec3): boolean {
        for ( let i = 0; i < this.planes.length; i ++ ) {
			if ( this.planes[ i ].distanceToPoint( point ) < 0 ) {
				return false;
			}
		}
		return true;
    }
    
    public static fromProjectionMatrix(matProj: mat4, ignoreNearPlane: boolean = false) {
        throw new Error("Not implemented");
    }
}
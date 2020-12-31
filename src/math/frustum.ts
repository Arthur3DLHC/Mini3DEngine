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

    /**
     * 
     * @param box 
     * @param transform NOTE: can only have rotation, translation and uniform scaling
     */
    public intersectsTransformedBox(box: BoundingBox, transform: mat4): boolean {
        // fix me: transform 8 points?
        // or transform planes to local space of box?
        // guess and test:
        // if transform the plane normal from local to world, use the M.inverse().transpose() matrix
        // so, if transform from world to local, use M.inverse().inverse().transpose() = M.transpose() ?
        const matNormal = transform.copyTo();
        matNormal.transpose();

        const matPosition = transform.copyTo();
        matPosition.inverse();

        const normal = new vec3();
        const coplanarPoint = new vec3();

        const tmpPlane = new Plane();

        for (let i = 0; i < this.planes.length; i++) {
            const plane = this.planes[i];
            matNormal.multiplyVec3Normal(plane.normal, normal);
            plane.normal.copyTo(coplanarPoint);
            coplanarPoint.scale(-plane.constant);
            matPosition.multiplyVec3(coplanarPoint, coplanarPoint);

            tmpPlane.setFromNormalAndPoint(normal, coplanarPoint);
            // corner at max distance
            Frustum._tmpVector.x = normal.x > 0 ? box.maxPoint.x : box.minPoint.x;
            Frustum._tmpVector.y = normal.y > 0 ? box.maxPoint.y : box.minPoint.y;
            Frustum._tmpVector.z = normal.z > 0 ? box.maxPoint.z : box.minPoint.z;

            if (tmpPlane.distanceToPoint(Frustum._tmpVector) < 0) {
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

    /**
     * 
     * @param matProj projection matrix
     * @param ignoreNearPlane 
     */
    public setFromProjectionMatrix(matProj: mat4, ignoreNearPlane: boolean = false): Frustum {
        // from three.js
        // theory is at https://www.gamedevs.org/uploads/fast-extraction-viewing-frustum-planes-from-world-view-projection-matrix.pdf
        // also http://www.cs.otago.ac.nz/postgrads/alexis/planeExtraction.pdf

        // note: there is an error in the theory document upon:
        // it saids the frustom calculated from the pure projection matrix of camera is looking at positive z axis in opengl,
        // but actually, its looking at negative z axis, in view space.

		const me = matProj.values;
		var me0 = me[ 0 ], me1 = me[ 1 ], me2 = me[ 2 ], me3 = me[ 3 ];
		var me4 = me[ 4 ], me5 = me[ 5 ], me6 = me[ 6 ], me7 = me[ 7 ];
		var me8 = me[ 8 ], me9 = me[ 9 ], me10 = me[ 10 ], me11 = me[ 11 ];
		var me12 = me[ 12 ], me13 = me[ 13 ], me14 = me[ 14 ], me15 = me[ 15 ];

        // todo: check ignore near plane
		this.planes[ 0 ].setComponents( me3 - me0, me7 - me4, me11 - me8, me15 - me12 ).normalize();
		this.planes[ 1 ].setComponents( me3 + me0, me7 + me4, me11 + me8, me15 + me12 ).normalize();
		this.planes[ 2 ].setComponents( me3 + me1, me7 + me5, me11 + me9, me15 + me13 ).normalize();
		this.planes[ 3 ].setComponents( me3 - me1, me7 - me5, me11 - me9, me15 - me13 ).normalize();
		this.planes[ 4 ].setComponents( me3 - me2, me7 - me6, me11 - me10, me15 - me14 ).normalize();
        this.planes[ 5 ].setComponents( me3 + me2, me7 + me6, me11 + me10, me15 + me14 ).normalize();
        
        return this;
    }
    
    public static fromProjectionMatrix(matProj: mat4, ignoreNearPlane: boolean = false): Frustum {
        const frustum = new Frustum();
        frustum.setFromProjectionMatrix(matProj, ignoreNearPlane);
        return frustum;
    }
}
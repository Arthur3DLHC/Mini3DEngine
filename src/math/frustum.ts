import { mat4, vec3 } from "gl-matrix";
import { BoundingBox } from "./boundingBox.js";
import { BoundingSphere } from "./boundingSphere.js";

/**
 * frustum for cull objects
 */
export class Frustum {
    public constructor() {

    }

    public setByProjectionMatrix(matProj: mat4) {
        throw new Error("Not implemented");
    }

    public intersectSphere(sphere: BoundingSphere): boolean {
        throw new Error("Not implemented");
    }

    public intersectBox(box: BoundingBox): boolean {
        throw new Error("Not implemented");
    }

    public containsPoint(point: vec3): boolean {
        throw new Error("Not implemented");
    }
}
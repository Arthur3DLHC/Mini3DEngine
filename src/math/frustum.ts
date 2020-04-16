import { mat4 } from "gl-matrix";
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

    public intersectSphere(sphere: BoundingSphere) {
        throw new Error("Not implemented");
    }

    public intersectBox(box: BoundingBox) {
        throw new Error("Not implemented");
    }
}
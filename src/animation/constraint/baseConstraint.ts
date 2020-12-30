import { Object3D } from "../../scene/object3D.js";

export class BaseConstraint {
    public constructor(owner: Object3D) {
        this._owner = owner;
    }

    public get owner() {return this._owner;}
    private _owner: Object3D;

    /**
     * update function. apply constraint to owner transform
     * NOTE: should modify the localtransform or worldTransform matrix directly
     * for local space constraints, update localTransform matrix;
     * for world space constraints, update worldTransform matrix.
     */
    public update() {}
}
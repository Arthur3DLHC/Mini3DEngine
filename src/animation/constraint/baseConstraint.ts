import { Object3D } from "../../scene/object3D.js";

export class BaseConstraint {
    public constructor(owner: Object3D) {
        this._owner = owner;
    }

    public get owner() {return this._owner;}
    private _owner: Object3D;

    /**
     * internal use
     * will be filled when updating objects in scene
     */
    // public static updateList: BaseConstraint[] = [];

    // public static updateConstraints() {
    //     for (const constraint of BaseConstraint.updateList) {
    //         constraint.update();
    //     }
    // }

    // public addToUpdateList() {BaseConstraint.updateList.push(this);}

    /**
     * update function. apply constraint to owner transform
     * NOTE: should modify the localtransform or worldTransform matrix directly
     * for local space constraints, update localTransform matrix;
     * for world space constraints, update worldTransform matrix.
     */
    public update() {}
}
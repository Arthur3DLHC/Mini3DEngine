import { Object3D } from "./object3D.js";

/**
 * base class for behaviors
 */
export class Behavior {
    public constructor(owner: Object3D) {
        this._owner = owner;
    }

    private _owner: Object3D;
    public get owner(): Object3D {
        return this._owner;
    }

    public update() {
        // subclass do things.
        // can use Clock.instance to get curr and elapsed time;
    }
}
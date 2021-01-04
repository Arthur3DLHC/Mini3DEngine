import { Object3D } from "./object3D.js";

/**
 * base class for behaviors
 */
export abstract class Behavior {
    public constructor(owner: Object3D) {
        this._owner = owner;
    }

    private _owner: Object3D;
    public get owner(): Object3D {
        return this._owner;
    }

    /** subclasses must return its own type name */
    public abstract get typeName(): string;

    public start() {
        // subclass can find required components and objects now.
    }

    public update() {
        // subclass do things.
        // can use Clock.instance to get curr and elapsed time;
    }
}
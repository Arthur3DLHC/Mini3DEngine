import { Behavior } from "../scene/behavior.js";
import { Object3D } from "../scene/object3D.js";
import { PhysicsWorld } from "./physicsWorld.js";

/**
 * base physics behavior
 */
export class PhysicsBehavior extends Behavior {
    public constructor(owner: Object3D, physicsWorld: PhysicsWorld) {
        super(owner);
        this._world = physicsWorld;
    }

    public get world() { return this._world; }

    public update() {
        // subclasses do actual works
    }

    private _world: PhysicsWorld;
}
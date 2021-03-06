import { Behavior } from "../scene/behavior.js";
import { Object3D } from "../scene/object3D.js";
import { PhysicsWorld } from "./physicsWorld.js";

/**
 * base physics behavior
 */
export class PhysicsBehavior extends Behavior {
    public get typeName(): string {
        return "PhysicsBehavior";
    }
    public isA(typeName: string): boolean {
        if(typeName === "PhysicsBehavior") return true;
        return super.isA(typeName);
    }
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
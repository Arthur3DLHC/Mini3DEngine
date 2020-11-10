/// <reference path = "../../tsDefinitions/cannon.d.ts" />

import { Clock } from "../scene/clock.js";

export class PhysicsWorld {
    public constructor() {
        this._world = new CANNON.World();
    }

    public get world(): CANNON.World
    {
        return this._world;
    }

    private _world: CANNON.World;

    public step() {
        if (this.world) {
            this.world.step(Clock.instance.elapsedTime);
        }
    }
}
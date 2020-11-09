/// <reference path = "../../tsDefinitions/cannon.d.ts" />

import { Clock } from "../scene/clock.js";

export class PhysicsWorld {
    public constructor() {
        this.world = new CANNON.World();
    }
    public world: CANNON.World | null;

    public step() {
        if (this.world) {
            this.world.step(Clock.instance.elapsedTime);
        }
    }
}
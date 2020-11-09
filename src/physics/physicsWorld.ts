/// <reference path = "../../tsDefinitions/cannon-es.d.ts" />

import * as Cannon from "cannon-es";
import { Clock } from "../scene/clock.js";

export class PhysicsWorld {
    public world: Cannon.World | null = null;

    public step() {
        if (this.world) {
            this.world.step(Clock.instance.elapsedTime);
        }
    }
}
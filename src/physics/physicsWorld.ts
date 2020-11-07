/// <reference path = "../../tsDefinitions/cannon-es.d.ts" />

import * as Cannon from "cannon-es";

export class PhysicsWorld {
    public world: Cannon.World | null = null;
}
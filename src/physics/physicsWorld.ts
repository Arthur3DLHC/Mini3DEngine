/// <reference path = "../../tsDefinitions/cannon.d.ts" />

import { Clock } from "../scene/clock.js";

export interface PhysicsWorldOptions {
    useSplitSolver?: boolean;
    numIterations?: number;
    tolerance?: number;
}

export class PhysicsWorld {
    public constructor(options?: PhysicsWorldOptions) {
        this._world = new CANNON.World();
        // todo: do some common init works?
        this._world.broadphase = new CANNON.NaiveBroadphase();

        const solver = new CANNON.GSSolver();
        if (options) {
            if (options.numIterations !== undefined) {solver.iterations = options.numIterations;}
            if (options.tolerance !== undefined) {solver.tolerance = options.tolerance;}
        }
        if (options && options.useSplitSolver) {
            this._world.solver = new CANNON.SplitSolver(solver);
        } else {
            this._world.solver = solver;
        }
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
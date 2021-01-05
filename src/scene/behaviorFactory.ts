import { ActionControlBehavior } from "../animation/actionControlBehavior.js";
import { Behavior } from "./behavior.js";
import { Object3D } from "./object3D.js";

/**
 * Base behavior factory class
 */
export class BehaviorFactory {
    public createBehavior(behaviorType: string, owner: Object3D, options: any): Behavior{
        switch(behaviorType) {
            case "":
                return new ActionControlBehavior(owner, []);
        }

        throw new Error("Not implemented");
    }
}
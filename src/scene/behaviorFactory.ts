import { Behavior } from "./behavior.js";
import { Object3D } from "./object3D.js";

/**
 * Base behavior factory class
 */
export interface BehaviorFactory {
    createBehavior(behaviorType: string, owner: Object3D, options: any): Behavior;
}
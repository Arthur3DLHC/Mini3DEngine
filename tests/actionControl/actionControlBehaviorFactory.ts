import { Behavior, Object3D } from "../../src/mini3DEngine.js";
import { CommonBehaviorFactory } from "../common/behaviors/commonBehaviorFactory.js";
import { ThirdPersonShooterBehavior } from "./thirdPersonShooterBehavior.js";

export class ActionControlBehaviorFactory extends CommonBehaviorFactory {
    createBehavior(behaviorType: string, owner: Object3D, options: any): Behavior {
        if (behaviorType === "ThirdPersonShooterBehavior") {
            // return new ThirdPersonShooterBehavior()
            throw new Error("Not implemented");
        } else {
            return super.createBehavior(behaviorType, owner, options);
        }
    }
}
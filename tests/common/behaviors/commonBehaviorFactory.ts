import { Behavior, BehaviorFactory, Object3D } from "../../../src/mini3DEngine.js";
import { AutoRotateBehavior } from "./autoRotateBehavior.js";
import { FirstPersonViewBehavior } from "./firstPersonViewBehavior.js";
import { MonsterCtrlBehavior } from "./monsterCtrlBehavior.js";
import { ThirdPersonCtrlBehavior } from "./thirdPersonCtrlBehavior.js";

export class CommonBehaviorFactory implements BehaviorFactory {

    createBehavior(behaviorType: string, owner: Object3D, options: any): Behavior {
        switch(behaviorType) {
            case "AutoRotateBehavior":
                break;
            case "FirstPersonViewBehavior":
                break;
            case "LookatBehavior":
                break;
            case "MonsterCtrlBehavior":
                break;
            case "ThirdPersonCtrlBehavior":
                break;
        }
        throw new Error("Method not implemented.");
    }
}
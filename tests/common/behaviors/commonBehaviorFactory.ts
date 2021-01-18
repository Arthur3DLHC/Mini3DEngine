import { Behavior, BehaviorFactory, Object3D } from "../../../src/mini3DEngine.js";
import { AutoRotateBehavior } from "./autoRotateBehavior.js";
import { FirstPersonViewBehavior } from "./firstPersonViewBehavior.js";
import { MonsterCtrlBehavior } from "../../scifiTPSGame/behaviors/monsterCtrlBehavior.js";
import { ThirdPersonCtrlBehavior } from "./thirdPersonCtrlBehavior.js";

export class CommonBehaviorFactory extends BehaviorFactory {

    createBehavior(behaviorType: string, owner: Object3D, options: any): Behavior {
        // todo: make the constructor of behaviors only have one param: owner
        // find other behaviors in Behavior.start() function
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
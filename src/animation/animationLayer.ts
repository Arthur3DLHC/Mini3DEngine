import { Object3D } from "../scene/object3D.js";
import { ActionControlBehavior } from "./actionControlBehavior.js";
import { AnimationAction } from "./animationAction.js";
import { AnimationApplyMode } from "./animationChannel.js";
import { AnimationMask } from "./animationMask.js";
import { ActionCondition } from "./stateMachine/actionCondition.js";
import { ActionState } from "./stateMachine/actionState.js";
import { ActionStateMachine } from "./stateMachine/actionStateMachine.js";

/**
 * animation layer
 * for implement complex animation control
 */
export class AnimationLayer {
    public constructor() {
    }

    public name: string = "";
    public mask: AnimationMask | null = null;
    public blendWeight: number = 1;
    public blendMode: AnimationApplyMode = AnimationApplyMode.replace;

    public stateMachine : ActionStateMachine | null = null;

    // todo: apply blendWeight to animations, how?
    public update() {
        if (this.stateMachine !== null) {
            this.stateMachine.update();
        }
    }

    public fromJSON(jsonData: any, jointRoot: Object3D, actionControl: ActionControlBehavior, animations: AnimationAction[], customStateCreation?: (stateDef: any) => ActionState, customConditionCreation?: (conditionDef: any) => ActionCondition) {
        if (jsonData.name === undefined) {
            throw new Error("animation layer name not found");
        }

        this.name = jsonData.name;

        if (jsonData.mask !== undefined) {
            this.mask = new AnimationMask();
            this.mask.fromJSON(jsonData.mask, jointRoot);
        }

        if (jsonData.blendWeight !== undefined) {
            this.blendWeight = jsonData.blendWeight;
        }

        if (jsonData.blendMode !== undefined) {
            this.blendMode = jsonData.blendMode;
        }
        
        // state machine
        if (jsonData.stateMachine !== undefined) {
            this.stateMachine = new ActionStateMachine(actionControl);
            this.stateMachine.fromJSON(jsonData.stateMachine, animations, customStateCreation, customConditionCreation);
        }
    }
}
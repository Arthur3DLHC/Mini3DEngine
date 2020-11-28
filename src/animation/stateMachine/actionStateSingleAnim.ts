import { Clock } from "../../scene/clock.js";
import { AnimationAction } from "../animationAction.js";
import { ActionCondition } from "./actionCondition.js";
import { ActionState } from "./actionState.js";
import { ActionStateMachine } from "./actionStateMachine.js";

export class ActionStateSingleAnim extends ActionState {

    public constructor(name: string, machine: ActionStateMachine) {
        super(name, machine);
        this.animation = null;
    }

    // hold the animationAction of this state?
    public animation: AnimationAction | null;

    public update() {
        super.update();
        if (this.animation !== null) {
            if (this.machine !== null) {
                // fix me: how to use the blendMode of the layer?
                this.animation.weight = this.machine.animationLayer.blendWeight;
                this.animation.mask = this.machine.animationLayer.mask;
            }
            
            this.animation.update(Clock.instance.curTime, Clock.instance.elapsedTime);
        }
    }

    public enter() {
        super.enter();
        // play action animation
        if (this.animation !== null) {
            this.animation.reset();
            this.animation.play();
        }
    }

    public exit() {
        super.exit();
        if (this.animation !== null) {
            this.animation.stop();
        }
    }

    public fromJSON(stateDef: any, animations: AnimationAction[], machine: ActionStateMachine, customConditionCreation?: (conditionDef: any)=>ActionCondition) {
        super.fromJSON(stateDef, animations, machine, customConditionCreation);
        if(stateDef.animation === undefined) {
            throw new Error("Missing animation name in ActionStateSigleAnim JSON object");
        }
        const anim = animations.find((action: AnimationAction) => {return action.name === stateDef.animation});
        if (anim === undefined) {
            throw new Error("Animation not found: " + stateDef.animation);
        }
        this.animation = anim;
    }
}
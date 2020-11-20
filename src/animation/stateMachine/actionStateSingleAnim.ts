import { Clock } from "../../scene/clock.js";
import { AnimationAction } from "../animationAction.js";
import { ActionState } from "./actionState.js";

export class ActionStateSingleAnim extends ActionState {

    public constructor(name: string) {
        super(name);
        this.animation = null;
    }

    // hold the animationAction of this state?
    public animation: AnimationAction | null;

    public update() {
        super.update();
        if (this.animation !== null) {
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

    public fromJSON(stateDef: any, animations: AnimationAction[]) {
        super.fromJSON(stateDef, animations);
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
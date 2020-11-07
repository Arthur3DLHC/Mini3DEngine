import { Clock } from "../../scene/clock.js";
import { AnimationAction } from "../animationAction.js";
import { ActionState } from "./actionState.js";

export class ActionStateSingle extends ActionState {
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
        // play action animation
        if (this.animation !== null) {
            this.animation.reset();
            this.animation.play();
        }
    }

    public exit() {
        if (this.animation !== null) {
            this.animation.stop();
        }
    }
}
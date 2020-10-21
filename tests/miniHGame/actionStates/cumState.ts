import { ActionState, TimeUpCondition } from "../../../src/mini3DEngine.js";

export class CumState extends ActionState {
    public constructor(name: string) {
        super(name);
    }

    // todo: use some general properties to control the state change? so do not need to derive a lot of subclasses
    // conditions and target states?

    /**
     * subclass can update animations, check conditions in this method
     * when some conditions true, change to another state
     */
    public update() {
        super.update();
    }

    /**
     * subclass can play animation, sound and so on in this method
     */
    public onEnter() {
        super.onEnter();

        // reset timeup condition's times?
        if (this.animation) {
            for (const transition of this.transitions) {
                for (const condition of transition.conditions) {
                    if (condition instanceof TimeUpCondition) {
                        // fix me: should record the duration on condition itself?
                        const timeup = condition as TimeUpCondition;
                        timeup.timeLeft = this.animation.duration;
                    }
                }
            }
        }
    }

    public onExit() {
        super.onExit();
        // reset the action request? 
    }
}
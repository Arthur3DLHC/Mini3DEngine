import { ActionCondition } from "./actionCondition.js";
import { ActionState } from "./actionState.js";

export class ActionTransition {
    public constructor(state: ActionState) {
        this._state = state;
    }

    public conditions: ActionCondition[] = [];
    public targetState: ActionState | null = null;

    /**
     * the state this condition belongs to
     */
    private _state: ActionState;

    public checkTransit() {
        // state is not in machine yet?
        if (this._state.machine === null) {
            return;
        }
        // if all conditions true, transite to target state?
        for (const condition of this.conditions) {
            if (!condition.isTrue) {
                return;
            }
        }

        this._state.machine.curState = this.targetState;
    }
}
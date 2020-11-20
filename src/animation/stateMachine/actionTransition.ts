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

    public resetConditions() {
        for (const condition of this.conditions) {
            condition.reset();
        }
    }

    public fromJSON(transDef: any, states: Map<string, ActionState>, customConditionCreation?: (conditionDef: any)=>ActionCondition) {
        // should always have conditions?
        if (transDef.target === undefined || transDef.conditions === undefined) {
            throw new Error("Target state not presented in JSON object");
        }
        const target = states.get(transDef.target);
        if (target === undefined) {
            throw new Error("Target state not found: " + transDef.target);
        }

        this.targetState = target;

        this.conditions = [];

        // read conditions
        for (const conditionDef of transDef.conditions) {
            // condition type
            // fix me: how to handle custom conditions of games?
            if(customConditionCreation) {
                const condition = customConditionCreation(conditionDef);
                condition.fromJSON(conditionDef);
                this.conditions.push(condition);
            }
        }
    }
}
import { Clock } from "../../scene/clock.js";
import { ActionCondition } from "./actionCondition.js";
import { ActionState } from "./actionState.js";
import { SingleParamCondition } from "./singleParamCondition.js";
import { TimeUpCondition } from "./timeUpCondition.js";

export class ActionTransition {

    public constructor(ownerState: ActionState) {
        this._state = ownerState;
    }

    public conditions: ActionCondition[] = [];
    public targetState: ActionState | null = null;
    public duration: number = 0;

    /**
     * the state this condition belongs to
     */
    private _state: ActionState;

    private _timeLeft: number = 0;

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

        if (this.duration > 0) {
            this._timeLeft -= Clock.instance.elapsedTime;
            if (this._timeLeft < 0) {
                this._state.machine.nextState = null;
                this._state.machine.curState = this.targetState;
            } else {
                this._state.machine.nextState = this.targetState;
            }
        } else {
            this._state.machine.curState = this.targetState;
            this._state.machine.nextState = null;
        }

        // todo: transit duration?
        // todo: 
        //      fade out animation of old state, and
        //      fade in animation of new state ?
        //      state machine should update both 2 state's animation?
    }

    public resetConditions() {
        for (const condition of this.conditions) {
            condition.reset();
        }
        this._timeLeft = this.duration;
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

        if (transDef.duration !== undefined) {
            this.duration = transDef.duration;
        }
        this._timeLeft = this.duration;

        // read conditions
        for (const conditionDef of transDef.conditions) {
            // condition type
            let condition: ActionCondition | null = null;
            if (conditionDef.typeStr === "singleParam") {
                condition = new SingleParamCondition(this._state.machine.actionCtrl);
            } else if(conditionDef.typeStr === "timeUp") {
                condition = new TimeUpCondition();
            } else if(customConditionCreation) {
                condition = customConditionCreation(conditionDef);
            }
            if (condition !== null) {
                condition.fromJSON(conditionDef);
                this.conditions.push(condition);
            }
        }
    }
}
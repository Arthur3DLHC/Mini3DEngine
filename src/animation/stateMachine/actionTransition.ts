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
        const machine = this._state.machine;
        if (machine === null) {
            return;
        }
        for (const condition of this.conditions) {
            if (!condition.isTrue) {
                return;
            }
        }

        // all conditions are true
        if (this.duration > 0) {
            this._timeLeft -= Clock.instance.elapsedTime;
            if (this._timeLeft < 0) {
                machine.nextState = null;
                if (machine.curState !== this.targetState) {
                    machine.curState = this.targetState;
                    if (machine.curState !== null) {
                        // already played when setted as next state
                        // machine.curState.playAnimation();
                        machine.curState.weight = 1;
                    }                    
                }
            } else {
                if (machine.nextState !== this.targetState) {
                    machine.nextState = this.targetState;
                    if (machine.nextState !== null) {
                        machine.nextState.playAnimation();
                    }
                }
                if (machine.curState !== null && machine.nextState !== null) {
                    const t = this._timeLeft / this.duration;
                    machine.curState.weight = t;
                    machine.nextState.weight = 1 - t;
                }
            }
        } else {
            if (machine.curState !== this.targetState) {
                machine.curState = this.targetState;
                if (machine.curState !== null) {
                    machine.curState.playAnimation();
                    machine.curState.weight = 1;
                }                
            }
            machine.nextState = null;
        }
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

        this._timeLeft = this.duration = transDef.duration || 0;

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
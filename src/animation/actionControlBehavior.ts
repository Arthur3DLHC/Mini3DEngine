import { Behavior } from "../scene/behavior.js";
import { Object3D } from "../scene/object3D.js";
import { AnimationAction } from "./animationAction.js";
import { ActionCondition } from "./stateMachine/actionCondition.js";
import { ActionState } from "./stateMachine/actionState.js";
import { ActionStateMachine } from "./stateMachine/actionStateMachine.js";

/**
 * hold the action state machine, and the parameters driving the machine
 */
export class ActionControlBehavior extends Behavior {
    public constructor(owner: Object3D, anims: AnimationAction[]) {
        super(owner);
        this._stateMachine = new ActionStateMachine(this);
        this._actionParams = new Map<string, number>();
        this._animations = anims;
    }

    private _stateMachine: ActionStateMachine;
    private _actionParams: Map<string, number>
    private _animations: AnimationAction[];

    public get stateMachine(): ActionStateMachine {
        return this._stateMachine;
    }

    /**
     * the parameters driving the state machine
     * states will change accroding to params in this list
     * blend weights also.
     * the params controlling blendtree node weights should be at 0 ~ 1 range?
     */
    public get actionParams(): Map<string, number> {
        return this._actionParams;
    }

    public get animations(): AnimationAction[] {
        return this._animations;
    }

    public update() {
        this._stateMachine.update();
    }

    public fromJSON(jsonData: any, customStateCreation?: (stateDef: any)=> ActionState, customConditionCreation?: (conditionDef: any)=>ActionCondition) {
        // add params first
        this._actionParams.clear();

        if (jsonData.actionParams !== undefined) {
            // param name and default value?
            // to iterate all properties through a js object, need to use for...in
            for (const paramName in jsonData.actionParams) {
                if (Object.prototype.hasOwnProperty.call(jsonData.actionParams, paramName)) {
                    const defaultVal = jsonData.actionParams[paramName];
                    this._actionParams.set(paramName, defaultVal);
                }
            }
        }
        
        // state machine
        if (jsonData.stateMachine !== undefined) {
            this._stateMachine.fromJSON(jsonData.stateMachine, this._animations, customStateCreation, customConditionCreation);
        }
    }
}
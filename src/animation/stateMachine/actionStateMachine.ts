import { ActionControlBehavior } from "../actionControlBehavior.js";
import { AnimationAction } from "../animationAction.js";
import { AnimationLayer } from "../animationLayer.js";
import { ActionCondition } from "./actionCondition.js";
import { ActionState } from "./actionState.js";
import { ActionStateBlendTree } from "./actionStateBlendTree.js";
import { ActionStateSingleAnim } from "./actionStateSingleAnim.js";

/**
 * action state machine
 */
export class ActionStateMachine {
    public constructor(actionCtrl: ActionControlBehavior, animLayer: AnimationLayer) {
        this._actionCtrl = actionCtrl;
        this._animLayer = animLayer;
    }

    public states: Map<string, ActionState> = new Map<string, ActionState>();

    private _curState: ActionState | null = null;

    public get curState(): ActionState | null {return this._curState;}
    public set curState(state: ActionState | null) {
        if (this._curState !== null) {
            this._curState.exit();
        }
        this._curState = state;
        if (state !== null) {
            state.enter();
        }
    }

    private _nextState: ActionState | null = null;
    public get nextState(): ActionState | null {return this._nextState;}
    public set nextState(state: ActionState | null) {
        this._nextState = state;
        if (state != null) {
            state.canCheckTransitions = false;
        }
    }

    private _actionCtrl: ActionControlBehavior;

    public get actionCtrl(): ActionControlBehavior {
        return this._actionCtrl;
    }

    private _animLayer: AnimationLayer;

    public get animationLayer(): AnimationLayer {
        return this._animLayer;
    }

    public addState(state: ActionState) {
        this.states.set(state.name, state);
    }

    public update() {
        // todo: state animation fade-in and fade-out
        // what if two animations are transitioning, and there is another state transition happened?
        // if we don't let new state transition happen when there is a transition transiting, then this problem will be solved?
        // what is the simplest way to do this?

        if (this._curState !== null) {
            this._curState.checkTransitions();
        }

        // _curState may be changed when check transitions
        if (this._curState !== null) {
            this._curState.update();
        }

        // nextState.canCheckTransitions will always be false now.
        // it will change to true after the state becomes curState
        if (this._nextState !== null) {
            this._nextState.update();
        }

        // fix me: where to update the weights of curState and nextState?
    }

    public fromJSON(json: any, animations: AnimationAction[], customStateCreation?: (stateDef: any)=> ActionState, customConditionCreation?: (conditionDef: any)=>ActionCondition) {
        this.states.clear();
        if (json.states !== undefined) {
            // need to add all states to machine first
            // becaulse the actionTransition.fromJSON method need a complte list of all states
            // to find it's target state
            for (const stateDef of json.states) {
                switch(stateDef.typeStr) {
                    case "single":
                        const single = new ActionStateSingleAnim(stateDef.name, this);
                        // single.fromJSON(stateDef, animations, this, customConditionCreation);
                        this.addState(single);
                        break;
                    case "blendTree":
                        const blendtree = new ActionStateBlendTree(stateDef.name, this);
                        // blendtree.fromJSON(stateDef, animations, this, customConditionCreation);
                        this.addState(blendtree);
                        break;
                    default:
                        if(customStateCreation) {
                            const state = customStateCreation(stateDef);
                            // state.fromJSON(stateDef, animations, this, customConditionCreation);
                            this.addState(state);
                        }
                        break;
                }
            }
            // then call the fromJSON for all states
            for (let index = 0; index < json.states.length; index++) {
                const stateDef = json.states[index];
                const state = this.states.get(stateDef.name);
                if (state !== undefined) {
                    state.fromJSON(stateDef, animations, this, customConditionCreation);
                }
            }
        }
        if (json.curState !== undefined) {
            const defState = this.states.get(json.curState);
            if (defState === undefined) {
                throw new Error("default state not found: " + json.curState);
            }
            this.curState = defState;
            this.curState.playAnimation();
        } else {
            console.warn("statemachine has no default state.");
        }
    }
}
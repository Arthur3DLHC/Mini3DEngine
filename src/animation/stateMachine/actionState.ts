import { Clock } from "../../scene/clock.js";
import { ActionStateMachine } from "./actionStateMachine.js";
import { AnimationAction } from "../animationAction.js";
import { ActionTransition } from "./actionTransition.js";

/**
 * base class of action states
 */
export class ActionState {
    public constructor(name: string) {
        this._name = name;
        this.machine = null;
    }

    public machine: ActionStateMachine | null;
    private _name: string;
    public get name(): string {return this._name;}

    // todo: can either hold an animationAction or a blend tree;

    public transitions: ActionTransition[] = [];

    /**
     * subclass can update animations, check conditions in this method
     * when some conditions true, change to another state
     */
    public update() {
        // check the current select action request
        // need to add another behavior to record current select action request?
        for (const trans of this.transitions) {
            trans.checkTransit();
        }
    }

    /**
     * subclass can play animation, sound and so on in this method
     */
    public enter() {
        for (const transition of this.transitions) {
            transition.resetConditions();
        }
    }

    public exit() {

    }

    public fromJSON(stateDef: any, animations: AnimationAction[]) {
        // todo: name, transitions
    }
}
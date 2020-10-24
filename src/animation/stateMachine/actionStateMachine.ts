import { ActionState } from "./actionState.js";

/**
 * action state machine
 */
export class ActionStateMachine {
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

    public addState(state: ActionState) {
        state.machine = this;
        this.states.set(state.name, state);
    }

    public update() {
        if (this._curState !== null) {
            this._curState.update();
        }
    }
}
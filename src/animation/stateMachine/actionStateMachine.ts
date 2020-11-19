import { ActionState } from "./actionState.js";
import { ActionStateBlendTree } from "./actionStateBlendTree.js";
import { ActionStateSingleAnim } from "./actionStateSingleAnim.js";

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

    public fromJSON(json: any) {
        this.states.clear();
        if (json.states !== undefined) {
            for (const stateDef of json.states) {
                switch(stateDef.typeStr) {
                    case "single":
                        const single = new ActionStateSingleAnim(stateDef.name);
                        single.fromJSON(stateDef);
                        this.addState(single);
                        break;
                    case "blendTree":
                        const blendtree = new ActionStateBlendTree(stateDef.name);
                        blendtree.fromJSON(stateDef);
                        this.addState(blendtree);
                        break;
                }
            }
        }
    }
}
import { ActionStateMachine, Behavior, Object3D } from "../mini3DEngine.js";

/**
 * hold the action state machine, and the parameters driving the machine
 */
export class ActionControlBehavior extends Behavior {
    public constructor(owner: Object3D) {
        super(owner);
        this._stateMachine = new ActionStateMachine();
        this._actionParams = new Map<string, number>();
    }

    private _stateMachine: ActionStateMachine;
    private _actionParams: Map<string, number>

    public get stateMachine(): ActionStateMachine {
        return this._stateMachine;
    }

    public get actionParams(): Map<string, number> {
        return this._actionParams;
    }

    public update() {
        this._stateMachine.update();
    }

    public fromJSON(jsonData: any) {

    }
}
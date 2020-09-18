import { ActionStateMachine, Behavior, Object3D } from "../../../src/mini3DEngine.js";

export class ActionControlBehavior extends Behavior {
    public constructor(owner: Object3D) {
        super(owner);
        this._stateMachine = new ActionStateMachine();
    }

    private _stateMachine: ActionStateMachine;

    public get stateMachine(): ActionStateMachine {
        return this._stateMachine;
    }

    public update() {
        this._stateMachine.update();
    }
}
import { ActionStateMachine } from "./actionStateMachine";

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

    /**
     * subclass can update animations, check conditions in this method
     * when some conditions true, change to another state
     */
    public update() {}

    /**
     * subclass can play animation, sound and so on in this method
     */
    public onEnter() {}

    public onExit() {}
}
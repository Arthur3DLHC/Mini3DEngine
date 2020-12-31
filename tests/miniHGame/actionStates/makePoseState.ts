import { ActionStateMachine, ActionStateSingleAnim, Object3D } from "../../../src/mini3DEngine.js";

export class MakePoseState extends ActionStateSingleAnim {
    public constructor(name: string, location: Object3D, owner: Object3D, machine: ActionStateMachine) {
        super(name, machine);
        this._location = location;
        this._owner = owner;
        this.onEnter = null;
    }

    private _location: Object3D;
    private _owner: Object3D;

    /**
     * callback function will be called when enter this state
     * the user can do some work like change UIs and so on.
     */
    public onEnter: ((state: MakePoseState) => void) | null;

    public enter() {
        super.enter();

        // put the owner to location
        this._location.translation.copyTo(this._owner.translation);
        this._location.rotation.copyTo(this._owner.rotation);
        this._owner.updateLocalTransform(true, false);

        if (this.onEnter !== null) {
            this.onEnter(this);
        }
    }
}
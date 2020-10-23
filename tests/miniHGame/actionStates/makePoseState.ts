import { ActionState, Object3D } from "../../../src/mini3DEngine.js";

export class MakePoseState extends ActionState {
    public constructor(name: string, location: Object3D, owner: Object3D) {
        super(name);
        this._location = location;
        this._owner = owner;
    }

    private _location: Object3D;
    private _owner: Object3D;

    public onEnter() {
        super.onEnter();

        // put the owner to location
        this._location.translation.copy(this._owner.translation);
        this._location.rotation.copy(this._owner.rotation);
        this._owner.updateLocalTransform();
    }
}
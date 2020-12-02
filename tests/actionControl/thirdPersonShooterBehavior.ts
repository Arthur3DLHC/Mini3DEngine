import { ActionControlBehavior, Camera, Object3D, RigidBody } from "../../src/mini3DEngine.js";
import { ThirdPersonCtrlBehavior } from "../common/behaviors/thirdPersonCtrlBehavior.js";

export class ThirdPersonShooterBehavior extends ThirdPersonCtrlBehavior {
    public constructor(owner: Object3D, body: RigidBody, camera: Camera, actionCtrl: ActionControlBehavior) {
        super(owner, body, camera);
        this._actionCtrl = actionCtrl;
        this._isFiring = false;

        // todo: pointer lock?
    }

    private _actionCtrl: ActionControlBehavior;

    private _isFiring: boolean;

    public onMouseDown(ev: MouseEvent) {
        super.onMouseDown(ev);

        if (ev.button === 0) {
            this._isFiring = true;
        }
    }

    public onMouseUp(ev: MouseEvent) {
        if (ev.button === 0) {
            this._isFiring = false;
        }
    }

    public update() {
        super.update();

        // todo: set the action params of action control

        // aiming?

        // use this.modelyaw and this.moveyaw to calc the forward and backward speed?

        // pitch

        // firing?
        // upperbody animaiton layer
    }
}
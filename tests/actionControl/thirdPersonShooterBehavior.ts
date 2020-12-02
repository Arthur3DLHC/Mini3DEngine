import { ActionControlBehavior, Camera, Object3D, RigidBody } from "../../src/mini3DEngine.js";
import { ThirdPersonCtrlBehavior } from "../common/behaviors/thirdPersonCtrlBehavior.js";

export class ThirdPersonShooterBehavior extends ThirdPersonCtrlBehavior {
    public constructor(owner: Object3D, body: RigidBody, camera: Camera, actionCtrl: ActionControlBehavior) {
        super(owner, body, camera);
        this._actionCtrl = actionCtrl;
        this._isShooting = false;

        // todo: pointer lock?
    }

    private _actionCtrl: ActionControlBehavior;

    private _isShooting: boolean;

    public onMouseDown(ev: MouseEvent) {
        super.onMouseDown(ev);

        if (ev.button === 0) {
            this._isShooting = true;
        }
    }

    public onMouseUp(ev: MouseEvent) {
        if (ev.button === 0) {
            this._isShooting = false;
        }
    }

    public update() {
        super.update();

        // todo: set the action params of action control

        // aiming?
        this._actionCtrl.actionParams.set("aiming", this.isAiming ? 0 : 1);

        // todo: use this.modelyaw and this.moveyaw to calc the forward and backward speed?

        // pitch
        const pitchLimit = 60 * Math.PI / 180;
        let updown = Math.max(-pitchLimit, Math.min(this.pitch, pitchLimit));
        updown /= pitchLimit;

        this._actionCtrl.actionParams.set("aimUpDown", updown);

        // shooting?
        this._actionCtrl.actionParams.set("shoot", this._isShooting ? 1 : 0);
        // upperbody animaiton layer
    }
}
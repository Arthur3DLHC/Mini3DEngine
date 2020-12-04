import { ActionControlBehavior, AnimationLayer, Camera, Object3D, RigidBody } from "../../src/mini3DEngine.js";
import { ThirdPersonCtrlBehavior } from "../common/behaviors/thirdPersonCtrlBehavior.js";

export class ThirdPersonShooterBehavior extends ThirdPersonCtrlBehavior {
    public constructor(owner: Object3D, body: RigidBody, camera: Camera, actionCtrl: ActionControlBehavior) {
        super(owner, body, camera);
        this._actionCtrl = actionCtrl;
        this._isShooting = false;

        this._upperBodyLayer = undefined;

        // todo: pointer lock?
    }

    private _actionCtrl: ActionControlBehavior;
    private _isShooting: boolean;
    private _upperBodyLayer: AnimationLayer | undefined;

    public set upperBodyLayer(layer: AnimationLayer | undefined) {this._upperBodyLayer = layer;}
    public get upperBodyLayer(): AnimationLayer | undefined {return this._upperBodyLayer;}

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

        // aiming?
        this._actionCtrl.actionParams.set("aiming", this.isAiming ? 1 : 0);

        let moveBlend = 0;
        if (this.isAiming) {
            // todo: should use this.modelyaw and this.moveyaw to calc a local move dir,
            // then set as params for a 2D directional blend
            // now use a simple 1D blend
            if (this.aimMoveSpeed > 0) {
                moveBlend = this.horizVelocity.length() / this.aimMoveSpeed;
                if (this._isMovingBackward) {
                    moveBlend = -moveBlend;
                }
            }
        } else {
            if (this.moveSpeed > 0) {
                moveBlend = this.horizVelocity.length() / this.moveSpeed;
            }
            if(moveBlend > 0) {
                moveBlend = Math.max(0, Math.min(moveBlend, 1));
            }
        }        
        this._actionCtrl.actionParams.set("moveSpeed", moveBlend);

        // pitch
        const pitchLimit = 60 * Math.PI / 180;
        let pitch = Math.max(-pitchLimit, Math.min(this.pitch, pitchLimit));
        pitch /= pitchLimit;

        this._actionCtrl.actionParams.set("aimPitch", pitch);

        // shooting?
        this._actionCtrl.actionParams.set("shoot", this._isShooting ? 1 : 0);

        // upperbody animaiton layer
        if (this._upperBodyLayer !== undefined) {
            if (this.isAiming) {
                this._upperBodyLayer.blendWeight = 1;
            } else {
                this._upperBodyLayer.blendWeight = 0;
            }
        }
    }
}
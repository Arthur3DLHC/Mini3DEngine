import vec3 from "../../../lib/tsm/vec3.js";
import { ActionControlBehavior, AnimationLayer, Camera, Clock, Object3D, RigidBody } from "../../../src/mini3DEngine.js";
import { ThirdPersonCtrlBehavior } from "../../common/behaviors/thirdPersonCtrlBehavior.js";
import { GameWorld } from "../gameWorld.js";
import { DamageInfo } from "./damageInfo.js";

export class TPSPlayerBehavior extends ThirdPersonCtrlBehavior {

    public get typeName(): string {
        return "TPSPlayerBehavior";
    }
    public isA(typeName: string): boolean {
        if(typeName === "TPSPlayerBehavior") return true;
        return super.isA(typeName);
    }
    public constructor(owner: Object3D, body: RigidBody, camera: Camera, actionCtrl: ActionControlBehavior) {
        super(owner, body, camera);
        this._actionCtrl = actionCtrl;
        this._isShooting = false;

        this._upperBodyLayer = undefined;
    }

    private _actionCtrl: ActionControlBehavior;
    private _isShooting: boolean;
    private _upperBodyLayer: AnimationLayer | undefined;
    
    public nextShootTime: number = 0;

    public shootInterval: number = 0.5;

    public set upperBodyLayer(layer: AnimationLayer | undefined) {this._upperBodyLayer = layer;}
    public get upperBodyLayer(): AnimationLayer | undefined {return this._upperBodyLayer;}

    public onMouseDown(ev: MouseEvent) {
        super.onMouseDown(ev);

        if (ev.button === 0) {
            if (this.isAiming) {
                if (!this._isShooting) {
                    this.nextShootTime = Clock.instance.curTime;
                    this._isShooting = true;
                }
            } else {
                // pick items or interacte with objects
                // start a query on objectTagRenderer?
                // what about continu
            }
        }
    }

    public onMouseUp(ev: MouseEvent) {
        super.onMouseUp(ev);
        if (ev.button === 0) {
            this._isShooting = false;
        }
    }

    public onAttacked() {
        // todo: change to attacked state?
        // prevent other actoins for a while?
        // throw new Error("Method not implemented.");
    }

    public update() {
        super.update();

        // aiming?
        this._actionCtrl.actionParams.set("aiming", this.isAiming ? 1 : 0);

        let moveBlend = 0;
        let strafeBlend = 0;
        if (this.isAiming) {
            // todo: should use this.modelyaw and this.moveyaw to calc a local move dir,
            // then set as params for a 2D directional blend
            // now use a simple 1D blend
            if (this.aimMoveSpeed > 0) {
                moveBlend = this.horizVelocity.length() / this.aimMoveSpeed;
                strafeBlend = moveBlend;

                const localMoveAngle = this.moveYaw - this.yaw;
                moveBlend *= Math.cos(localMoveAngle);
                strafeBlend *= -Math.sin(localMoveAngle);

                if (this._isMovingBackward) {
                    // console.info("moveBlend: " + moveBlend);
                //     moveBlend = -moveBlend;
                }
            }
        } else {
            if (this.moveSpeed > 0) {
                moveBlend = this.horizVelocity.length() / this.moveSpeed;
            }
            // if(moveBlend > 0) {
                moveBlend = Math.max(0, Math.min(moveBlend, 1));
            // }
        }        
        this._actionCtrl.actionParams.set("moveSpeed", moveBlend);
        this._actionCtrl.actionParams.set("strafeSpeed", strafeBlend);

        // pitch
        const pitchLimit = 60 * Math.PI / 180;
        let pitch = Math.max(-pitchLimit, Math.min(this.pitch, pitchLimit));
        pitch /= pitchLimit;

        this._actionCtrl.actionParams.set("aimPitch", pitch);

        // shooting?
        this._actionCtrl.actionParams.set("shoot", this._isShooting ? 1 : 0);

        // todo: shoot interval? defined by weapon
        // if time to shoot once, shoot in different ways according to current weapon
        // pistals, shotguns, machineguns: 
        //      query pixel object picking; render object IDs to picking FBO
        //      in the next frame, if there is a query, read back the picking FBO and check if any enemy object picked; damage them; clear the query;
        // grenades, rockets, plasma:
        //      create a bullet object use cannon.js physics collision?

        // use a simple method to check if any monsters are shooted?
        // to test the monster damaged state and animation
        // how to iterate all monster gameobjects in scene?
        if (this._isShooting && this.isAiming) {
            if (this.nextShootTime <= Clock.instance.curTime) {

                // TODO: query by objectTagRenderer

                const monsterPosition: vec3 = new vec3();
                const myPosition: vec3 = this.owner.worldTransform.getTranslation();
                
                // shoot dir
                // or use inverse world matrix as view transform?
                const shootDir: vec3 = this.owner.worldTransform.multiplyVec3Normal(new vec3([0, 0, 1]));
                const sideDir: vec3 = this.owner.worldTransform.multiplyVec3Normal(new vec3([1, 0, 0]));

                for (const monster of GameWorld.monsters) {
                    const obj = monster.owner;
                    obj.worldTransform.getTranslation(monsterPosition);

                    // use camera view transform?
                    // or use model facing dir?

                    monsterPosition.subtract(myPosition);

                    // dot product?
                    const sideDist = vec3.dot(monsterPosition, sideDir);
                    if (Math.abs(sideDist) < 0.3) {
                        const forwardDist = vec3.dot(monsterPosition, shootDir);
                        if (forwardDist > 0) {
                            const damageInfo: DamageInfo = new DamageInfo(this.owner, 1);
                            if (forwardDist < 2) {
                                damageInfo.blowUp = true;
                            } else {
                            }
                            monster.onAttacked(damageInfo);
                        }
                    }
                }
                this.nextShootTime = Clock.instance.curTime + this.shootInterval;
            }
        }

        // upperbody animaiton layer
        if (this._upperBodyLayer !== undefined) {
            if (this.isAiming) {
                this._upperBodyLayer.blendWeight = 1;
            } else {
                this._upperBodyLayer.blendWeight = 0;
            }
        }

        // todo: attacked, down...
    }

    public getShootDir(dir: vec3) {
        this.owner.worldTransform.multiplyVec3Normal(new vec3([0, 0, 1]), dir);
    }
}
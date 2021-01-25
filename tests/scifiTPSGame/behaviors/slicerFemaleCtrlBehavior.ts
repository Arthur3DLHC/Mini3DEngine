import vec2 from "../../../lib/tsm/vec2.js";
import vec3 from "../../../lib/tsm/vec3.js";
import { ActionControlBehavior } from "../../../src/animation/actionControlBehavior.js";
import { Clock } from "../../../src/mini3DEngine.js";
import { RigidBody } from "../../../src/physics/rigidBody.js";
import { Object3D } from "../../../src/scene/object3D.js";
import { Scene } from "../../../src/scene/scene.js";
import { DamageInfo } from "./damageInfo.js";
import { MonsterCtrlBehavior } from "./monsterCtrlBehavior.js";
import { TPSPlayerBehavior } from "./tpsPlayerBehavior.js";

export enum SlicerFemaleState {
    Idle,
    MovingForward,
    StrafingLeft,
    StrafingRight,
    AttackingFront,
    AttackingBack,
    Attacked,
    Jumping,
    Down,
}

export class SlicerFemaleCtrlBehavoir extends MonsterCtrlBehavior {

    public get typeName(): string {
        return "SlicerFemaleCtrlBehavoir";
    }
    public isA(typeName: string): boolean {
        if(typeName === "SlicerFemaleCtrlBehavoir") return true;
        return super.isA(typeName);
    }
    public constructor(owner: Object3D, body: RigidBody, actionCtrl: ActionControlBehavior, scene: Scene) {
        super(owner, body, actionCtrl, scene);

        body.body.addEventListener("collide", (ev: any) => {
            const contact: CANNON.ContactEquation = ev.contact;
            // todo: check contact normal dir, set canJump flag
            // fix me: what if the monster fall down from an edge?

            // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
            // We do not yet know which one is which! Let's check.
            if (contact.bi.id === body.body.id) {       // bi is the monster body, flip the contact normal
                contact.ni.negate(this._contactNormal);
            } else {
                this._contactNormal.copy(contact.ni);   // bi is something else. Keep the normal as it is
            }

            // assuming the up vector is always [0, 1, 0]
            if (this._contactNormal.y > 0.5) {
                // maybe jumping or attacked state on air
                // change to Idle state?
                this.rest();
                //this._canJump = true;
            }
        });
    }

    public jumpHorizSpeed: number = 2;
    public jumpVertiSpeed: number = 1;


    public strafeSpeed: number = 1;

    protected _curState: SlicerFemaleState = SlicerFemaleState.Idle;
    /** already hit player when jumping? */
    protected _jumpHit: boolean = false;
    private _contactNormal: CANNON.Vec3 = new CANNON.Vec3();    // // Normal in the contact, pointing *out* of whatever the player touched
    // for dodging
    private static _tmpPlayerToMeVec: vec3 = new vec3();

    public update() {
        const curTime = Clock.instance.curTime;

        super.update();
        if (this._player === null) {
            return;
        }

        let chance: number = 0;

        switch(this._curState) {
            case SlicerFemaleState.Idle:
                this._veloctity.x = 0;
                this._veloctity.z = 0;

                // when idle, only think once every 1 second?
                // todo: reduce interval when caution
                if (curTime - this._lastThinkTime > this.thinkInterval || this._caution) {
                    // priority:

                    // attack (front, back, jump)
                    if (this.attackIfCan()) {
                        break;
                    }

                    // chances strafe to dodge damage
                    if (this.needsToDodge()) {
                        this.strafe();
                        break;
                    }

                    // chase player
                    if(this.playerInSight(!this._caution)) {
                        // if player in sight, move ?
                        this.moveTo(MonsterCtrlBehavior._playerPosition);
                    }
                }
                break;
            case SlicerFemaleState.MovingForward:
                // upate destination position
                // always player cur position for now?
                MonsterCtrlBehavior._playerPosition.copyTo(this._destination);

                // slicer moves and turns faster than infected female
                this.turnToFaceDestination();

                // move toward cur facing dir
                this._veloctity.x = this._facingDir.x * this.moveSpeed;
                this._veloctity.z = this._facingDir.z * this.moveSpeed;

                // attack or dodge
                // attack (front, back, jump)
                if (this.attackIfCan()) {
                    break;
                }

                // chances strafe to dodge damage
                if (this.needsToDodge()) {
                    this.strafe();
                    break;
                }

                // if too far, rest
                if (this._distToPlayer > this.senseRange) {
                    this.rest();
                }

                break;
            case SlicerFemaleState.StrafingLeft:
                // velocity
                // need to calc left side dir
                this._veloctity.x = this._facingDir.z * this.strafeSpeed;
                this._veloctity.z = -this._facingDir.x * this.strafeSpeed;

                // count down
                this._recoverTimeLeft -= Clock.instance.elapsedTime;
                if (this._recoverTimeLeft < 0) {
                    this.rest();
                }

                break;
            case SlicerFemaleState.StrafingRight:
                // velocity
                // need to calc left side dir
                this._veloctity.x = -this._facingDir.z * this.strafeSpeed;
                this._veloctity.z = this._facingDir.x * this.strafeSpeed;

                // count down
                this._recoverTimeLeft -= Clock.instance.elapsedTime;
                if (this._recoverTimeLeft < 0) {
                    this.rest();
                }
                break;
            case SlicerFemaleState.Jumping:
                // don't change velocity;
                // jump state is a blendtree state,
                // blends the jumpup and falldown animation
                // set y speed param as blending param
                const blendfactor = Math.max(-1, Math.min(this._veloctity.y, 1));
                this._actionCtrl.actionParams.set("ySpeed", blendfactor);

                // turn to idle state when touch ground?
                // (in collision response callback)

                // when to do damage to player?
                if (!this._jumpHit) {
                    // fix me: how to check damage range?
                    if (this._distToPlayer < 1) {
                        // todo: damage player
                        const tpsBeh = this._player.getBehaviorByTypeName("TPSPlayerBehavior") as TPSPlayerBehavior;
                        if (tpsBeh !== undefined) {
                            tpsBeh.onAttacked();
                            this._jumpHit = true;
                        }
                    }
                }
                break;
            case SlicerFemaleState.AttackingFront:
                // count down
                this._veloctity.x = 0;
                this._veloctity.z = 0;
                this._recoverTimeLeft -= Clock.instance.elapsedTime;
                if (this._hitTimeLeft > 0) {
                    this._hitTimeLeft -= Clock.instance.elapsedTime;
                    if (this._hitTimeLeft <= 0.0 && this._player !== null) {
                        // player is still in attack range?
                        // front or back?

                    }
                }
                break;
            case SlicerFemaleState.AttackingBack:
                
                break;
            case SlicerFemaleState.Attacked:
                // may be attacked on air
                // count down
                break;
            case SlicerFemaleState.Down:
                break;
        }
    }


    public moveTo(dest: vec3) {
        // if (this._curState !== SlicerFemaleState.Down) {
            dest.copyTo(this._destination);
            this._curState = SlicerFemaleState.MovingForward;
            this._actionCtrl.actionParams.set("curAction", SlicerFemaleState.MovingForward);
        //}
    }

    public strafe() {
        // note: only strafe when facing player? 'saw' player is aiming

        // strafe left or right? randomly?
        const rand = Math.random();
        if (rand <= 0.5) {
            this._curState = SlicerFemaleState.StrafingLeft;
        } else {
            this._curState = SlicerFemaleState.StrafingRight;
        }
        this._caution = true;
        this._recoverTimeLeft = 0.5;
        this._actionCtrl.actionParams.set("curAction", this._curState);
    }

    public attack(front: boolean) {
        // attack toward current orientation
        // let player have chance to dodge
        this._caution = true;
        this._recoverTimeLeft = 1.85;
        // let action = this._curState * 100;
        if (front) {
            this._hitTimeLeft = 0.73;
            this._curState = SlicerFemaleState.AttackingFront;
        } else {
            // action = this._curState * 100 + 1;
            this._hitTimeLeft = 0.73;
            this._curState = SlicerFemaleState.AttackingBack;
        }
        this._actionCtrl.actionParams.set("curAction", this._curState);
    }

    public jump() {
        // todo: set jump velocity once?
        this._veloctity.x = this._facingDir.x * this.jumpHorizSpeed;
        this._veloctity.z = this._facingDir.z * this.jumpHorizSpeed;
        this._veloctity.y = this.jumpVertiSpeed;
        
        this._caution = true;
        this._jumpHit = false;
        this._curState = SlicerFemaleState.Jumping;
        this._actionCtrl.actionParams.set("curAction", SlicerFemaleState.Jumping);
    }

    public rest() {
        // if (this._curState !== SlicerFemaleState.Down) {
            this._curState = SlicerFemaleState.Idle;
            this._actionCtrl.actionParams.set("curAction", SlicerFemaleState.Idle);
        //}
    }

    public onAttacked(damageInfo: DamageInfo): void {
        // if is jumping, play heavy damage animation; and modify the velocity by shoot dir?

        // 

        throw new Error("Method not implemented.");
    }
    
    private playerInJumpAttackRange(): boolean {
        throw new Error("Method not implemented.");
    }

    private attackIfCan(): boolean {
        if(vec3.dot(this._playerDir, this._facingDir) > 0) {
            if (this.playerInMeleeAttackRange(!this._caution)) {
                // front melee attack
                this.attack(true);
                return true;
            } else if(this.playerInJumpAttackRange()) {
                // chances for jump attack
                const chance = Math.random();
                if (chance < 0.8) {
                    this.jump();
                    return true;
                }
            }
        } else {
            // back attack, only when caution
            // check back attack range
            if (this._caution && this._distToPlayer < this.meleeAttackRange) {
                this._playerDir.negate(MonsterCtrlBehavior._tmpDir);
                if (this.inView(MonsterCtrlBehavior._tmpDir, this.meleeAttackHalfFOV)) {
                    this.attack(false);
                    return true;
                }
            }
        }
        return false;
    }

    private needsToDodge(): boolean {
        if (this._player === null) {
            return false;
        }
        const tpsBeh = this._player.getBehaviorByTypeName("TPSPlayerBehavior") as TPSPlayerBehavior;
        if (tpsBeh !== undefined) {
            if (tpsBeh.isAiming) {
                // I saw player is aiming at me?
                if (this.inView(this._playerDir, 0.3)) {
                    tpsBeh.getShootDir(MonsterCtrlBehavior._tmpDir);
                    // this._playerDir.negate(SlicerFemaleCtrlBehavoir._tmpPlayerToMeDir);
                    MonsterCtrlBehavior._myPosition.copyTo(SlicerFemaleCtrlBehavoir._tmpPlayerToMeVec);
                    SlicerFemaleCtrlBehavoir._tmpPlayerToMeVec.subtract(MonsterCtrlBehavior._playerPosition);
                    // only check 2D angle?
                    SlicerFemaleCtrlBehavoir._tmpPlayerToMeVec.y = 0;
                    MonsterCtrlBehavior._tmpDir.y = 0;

                    // project my position to aiming dir
                    const b = vec3.dot(MonsterCtrlBehavior._tmpDir, SlicerFemaleCtrlBehavoir._tmpPlayerToMeVec);
                    const c = this._distToPlayer;
                    const aSq = c * c - b * b;
                    // if dist to aiming plan < 0.2, strafe
                    if (aSq < 0.04) {
                        const chance = Math.random();
                        if (chance < 0.6) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
}
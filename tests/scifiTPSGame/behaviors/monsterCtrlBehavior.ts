import mat4 from "../../../lib/tsm/mat4.js";
import quat from "../../../lib/tsm/quat.js";
import vec3 from "../../../lib/tsm/vec3.js";
import { ActionControlBehavior, AnimationLayer, Behavior, Clock, Object3D, RigidBody, Scene } from "../../../src/mini3DEngine.js";
import { GameWorld } from "../gameWorld.js";
import { TPSPlayerBehavior } from "./tpsPlayerBehavior.js";

export enum MonsterState {
    Idle,
    Moving,
    Attacking,
    Attacked,
    Down,
}

/**
 * general monster control
 */
export class MonsterCtrlBehavior extends Behavior {
    public get typeName(): string {
        return "MonsterCtrlBehavior";
    }
    public constructor(owner: Object3D, body: RigidBody, actionCtrl: ActionControlBehavior, scene: Scene) {
        super(owner);
        this._body = body;
        this._veloctity = this._body.body.velocity;
        this._actionCtrl = actionCtrl;
        this._scene = scene;
        // this._player = player;
    }

    // movement properties ?
    /** m / s */
    public moveSpeed: number = 1.0;
    /** rad / s */
    public turnSpeed: number = 3.14;

    public allowJump: boolean = false;

    public senseRange: number = 3.0;
    /** in radians */
    public senseHalfFOV: number = Math.PI;
    public meleeAttackRange: number = 1.0;              // simple judgement? not using physics collision detection ?
    /** in radians */
    public meleeAttackHalfFOV: number = Math.PI / 4.0;      // should vary according to the melee attack action ?

    public HP: number = 5;

    public attackingActions: number = 1;
    public attackedActions: number = 1;

    public upperBodyLayer: AnimationLayer | undefined;

    // orientation ?
    // look orientation and move orientation
    // use yaw pitch or use vectors ?

    /** yaw in radian */
    public yaw: number = 0;
    /** pitch in radian */
    public pitch: number = 0;

    // ai?
    /** seconds */
    public thinkInterval: number = 1.0;

    // components
    private _body: RigidBody;
    private _veloctity: CANNON.Vec3;    // alias of CANNON.Body.velocity
    private _actionCtrl: ActionControlBehavior;

    // todo: navigation grid agent?

    // ref objects
    // enemy (player) object?
    private _scene: Scene;
    private _player: Object3D | null = null;
    private _destination: vec3 = new vec3();

    private _destinationDir: vec3 = new vec3();
    private _distToPlayer: number = 10000;

    /** cur facing dir calculated from cur yaw and pitch */
    private _facingDir: vec3 = new vec3();

    // private _lastThinkTime: number = 0;
    // cur state?
    private _curState: MonsterState = MonsterState.Idle;
    // private _curAction: number = 0;
    /** recover time left for states like attacking, attacked, down */
    private _recoverTimeLeft: number = 0;
    private _hitTimeLeft: number = 0;

    private static _tmpMyPosition: vec3 = new vec3();
    private static _tmpPlayerPosition: vec3 = new vec3();
    private static _tmpDir: vec3 = new vec3();

    private static readonly _upDir = new vec3([0, 1, 0]);

    public start() {
        this._player = this._scene.getChildByName("Player");
        if (this._player === null) {
            throw new Error("Player not found.");
        }

        GameWorld.monsters.push(this);

        // todo: init facing dir according to the world transform of owner object?

        // the precedure of add a monster:
        // load all monster prefabs (json)
        // load monster agent from level gltf
        //  get prefab accroding to monster prefab key;
        //  load from monster gltf accroding to the model res key defined in prefab;
        //  add components of prefab to monster object; set properties of these components
        // add monster object to scene
        // update local and world transforms of all objects in the scene for the first time
        // call start() for all behaviors of all objects

        // so the worldTransform of owner should have been updated already now
        this.owner.worldTransform.multiplyVec3Normal(new vec3([0, 0, 1]), this._facingDir);
        // this._facingDir.normalize();
    }

    public update() {
        // const curTime = Clock.instance.curTime;
        // if (curTime - this._lastThinkTime > this.thinkInterval) {
        //     this.think();
        //     this._lastThinkTime = curTime;
        // }

        // facing dir
        // 
        // this._facingDir.setComponents(0, 0, 0);
        // let facingYaw = this.yaw + Math.PI * 0.5;
        // this._facingDir.x = Math.cos(facingYaw);
        // this._facingDir.z = -Math.sin(facingYaw);
        if (this._player !== null) {
            this.owner.worldTransform.getTranslation(MonsterCtrlBehavior._tmpMyPosition);
            this._player.worldTransform.getTranslation(MonsterCtrlBehavior._tmpPlayerPosition);

            // set player direction as destination direction
            vec3.direction(MonsterCtrlBehavior._tmpPlayerPosition, MonsterCtrlBehavior._tmpMyPosition, this._destinationDir);
            this._distToPlayer = vec3.distance(MonsterCtrlBehavior._tmpMyPosition, MonsterCtrlBehavior._tmpPlayerPosition);
        }

        switch(this._curState) {
            case MonsterState.Idle:
                // this._curAction = 0;
                // if player in attack range, attack ?
                this._veloctity.x = 0;
                this._veloctity.z = 0;
                if(this.playerInMeleeAttackRange()) {
                    this.attack();
                } else if(this.playerInSight()) {
                    // if player in sight, move ?
                    this.moveTo(MonsterCtrlBehavior._tmpPlayerPosition);
                } else {
                    // if idled for a well, move to an random destination?
                }
                break;
            case MonsterState.Moving:
                // upate destination position
                // always player cur position for now?
                MonsterCtrlBehavior._tmpPlayerPosition.copyTo(this._destination);

                // turn toward destination dir?
                // calculate dest yaw?
                // or use quaternions? how?
                this.turnToFaceDestination();

                // move toward cur facing dir
                this._veloctity.x = this._facingDir.x * this.moveSpeed;
                this._veloctity.z = this._facingDir.z * this.moveSpeed;

                // if approached destination position, idle or attack ?
                // refers to cur behavior is patrolling or chasing?
                // what if player dead? change state to idle?
                if (this.playerInMeleeAttackRange()) {
                    this.attack();
                } else if (this._distToPlayer > this.senseRange) {
                    this.rest();
                }
                break;
            case MonsterState.Attacking:
                // recover time left
                this._veloctity.x = 0;
                this._veloctity.z = 0;
                this._recoverTimeLeft -= Clock.instance.elapsedTime;
                this._hitTimeLeft -= Clock.instance.elapsedTime;
                if (this._hitTimeLeft < 0.0 && this._player !== null) {
                    this._hitTimeLeft = 1000;
                    const playerCtrl: TPSPlayerBehavior | undefined = this._player.getBehaviorByTypeName("TPSPlayerBehavior") as TPSPlayerBehavior;
                    if (playerCtrl !== undefined) {
                        playerCtrl.onAttacked();
                    }
                }
                if (this._recoverTimeLeft < 0.0) {
                    // attack again or rest?
                    // if (this.playerInMeleeAttackRange()) {
                    //     this.attack();
                    // } else {
                        this.rest();
                    //}
                }
                break;
            case MonsterState.Attacked:
                this._veloctity.x = 0;
                this._veloctity.z = 0;
                
                // recover time left
                this._recoverTimeLeft -= Clock.instance.elapsedTime;
                // if recovered (and player in sense range?), move toward player
                if (this._recoverTimeLeft < 0.0) {
                    // move to player?
                    this.moveTo(MonsterCtrlBehavior._tmpPlayerPosition);
                    // if(this.playerInSight()) {
                    //     // if player in sight, move ?
                    //     this.moveTo(MonsterCtrlBehavior._tmpPlayerPosition);
                    // } else {
                    //     this.rest();
                    // }
                }
                break;
            case MonsterState.Down:
                this._veloctity.x = 0;
                this._veloctity.z = 0;
                // set actionCtrl params
                // if already down, can not transit to other states?
                break;
        }

        if (this.upperBodyLayer !== undefined) {
            if (this._curState === MonsterState.Attacked) {
                this.upperBodyLayer.blendWeight = 1;
            } else {
                this.upperBodyLayer.blendWeight = 0;
            }
        }

        // this._actionCtrl.actionParams.set("curAction", this._curAction);
    }

    public moveTo(dest: vec3) {
        if (this._curState !== MonsterState.Down ) {
            dest.copyTo(this._destination);
            this._curState = MonsterState.Moving;
            this._actionCtrl.actionParams.set("curAction", MonsterState.Moving);
        }
    }

    public attack() {
        // attack toward current orientation ?
        this._curState = MonsterState.Attacking;
        this._recoverTimeLeft = 1.75;
        this._hitTimeLeft = 0.5;
        // todo: select attack action randomly
        this._actionCtrl.actionParams.set("curAction", this._curState * 100 + Math.round(Math.random() * (this.attackingActions - 1)));

        // if facing player and close enough, player take damage ?
    }

    public onAttacked() {
        if (this._curState !== MonsterState.Down) {
            // todo: calculate damage and hp left.
            // if hp < 0, down; else attacked
            // the down animation will be played once and keep the pose at last frame;
            this.HP--;

            if (this.HP > 0) {
                this._curState = MonsterState.Attacked;
                this._actionCtrl.actionParams.set("curAction", MonsterState.Attacked);
                this._recoverTimeLeft = 0.5;                
            } else {
                this._curState = MonsterState.Down;
                this._actionCtrl.actionParams.set("curAction", MonsterState.Down);
            }
            // todo: different animation of damage: light and heavy

        }
    }

    public rest() {
        if (this._curState !== MonsterState.Down) {
            this._curState = MonsterState.Idle;
            this._actionCtrl.actionParams.set("curAction", MonsterState.Idle);
        }
    }

    private playerInSight(): boolean {
        if (this._player === null) {
            return false;
        }

        // distance
        if (this._distToPlayer > this.senseRange) {
            return false;
        }

        // if (this._distToPlayer < 0.7) {
        //     return true;
        // }

        // orientation ? sense player by vision, sound or smell ?
        if (this.senseHalfFOV < Math.PI) {
            if (!this.inView(this._destinationDir, this.senseHalfFOV)) {
                return false;
            }
        }
        return true;
    }

    private playerInMeleeAttackRange(): boolean {
        if (this._player === null) {
            return false;
        }

        // distance
        if (this._distToPlayer > this.meleeAttackRange) {
            return false;
        }

        // orientation ? sense player by vision, sound or smell ?
        if (this.meleeAttackHalfFOV < Math.PI) {
            if (!this.inView(this._destinationDir, this.meleeAttackHalfFOV)) {
                return false;
            }
        }
        return true;
    }

    private inView(targetDir: vec3, halfFOV: number): boolean {
        const cosFOV = Math.cos(halfFOV);
        const cosFacing = vec3.dot(this._facingDir, targetDir);
        // facing angle < half fov
        return cosFacing > cosFOV;
    }

    /** turn a bit to face destination direction */
    private turnToFaceDestination() {
        // rotate facing dir
        this._destinationDir.copyTo(MonsterCtrlBehavior._tmpDir);
        MonsterCtrlBehavior._tmpDir.scale(this.turnSpeed * Clock.instance.elapsedTime);
        this._facingDir.add(MonsterCtrlBehavior._tmpDir);
        this._facingDir.normalize();

        // set rotation of owner
        quat.fromLookRotation(this._facingDir, MonsterCtrlBehavior._upDir, this.owner.rotation);
    }
}
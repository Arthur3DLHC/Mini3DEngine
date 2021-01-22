import quat from "../../../lib/tsm/quat.js";
import vec3 from "../../../lib/tsm/vec3.js";
import { ActionControlBehavior, AnimationLayer, Behavior, Clock, Object3D, RigidBody, Scene } from "../../../src/mini3DEngine.js";
import { GameWorld } from "../gameWorld.js";
import { DamageInfo } from "./damageInfo.js";
import { TPSPlayerBehavior } from "./tpsPlayerBehavior.js";


/**
 * general monster control
 */
export abstract class MonsterCtrlBehavior extends Behavior {
    public get typeName(): string {
        return "MonsterCtrlBehavior";
    }
    public isA(typeName: string): boolean {
        if(typeName === "MonsterCtrlBehavior") return true;
        return super.isA(typeName);
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
    protected _body: RigidBody;
    protected _veloctity: CANNON.Vec3;    // alias of CANNON.Body.velocity
    protected _actionCtrl: ActionControlBehavior;

    // todo: navigation grid agent?

    // ref objects
    // enemy (player) object?
    protected _scene: Scene;
    protected _player: Object3D | null = null;
    protected _destination: vec3 = new vec3();

    protected _destinationDir: vec3 = new vec3();
    protected _distToPlayer: number = 10000;

    /** set to true when attacked by player or attack player once */
    protected _caution: boolean = false;

    /** cur facing dir calculated from cur yaw and pitch */
    protected _facingDir: vec3 = new vec3();

    protected _lastThinkTime: number = 0;
    // cur state?
    // private _curAction: number = 0;
    /** recover time left for states like attacking, attacked, down */
    protected _recoverTimeLeft: number = 0;
    protected _hitTimeLeft: number = 0;

    protected static _tmpMyPosition: vec3 = new vec3();
    protected static _tmpPlayerPosition: vec3 = new vec3();
    protected static _tmpDir: vec3 = new vec3();

    protected static readonly _upDir = new vec3([0, 1, 0]);

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

        // todo: chase player after attacked.

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

        // this._actionCtrl.actionParams.set("curAction", this._curAction);
    }

    public abstract onAttacked(damageInfo: DamageInfo): void;

    protected playerInSight(checkFOV: boolean): boolean {
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
        if (checkFOV) {
            if (this.senseHalfFOV < Math.PI) {
                if (!this.inView(this._destinationDir, this.senseHalfFOV)) {
                    return false;
                }
            }
        }

        return true;
    }

    protected playerInMeleeAttackRange(checkFOV: boolean): boolean {
        if (this._player === null) {
            return false;
        }

        // distance
        if (this._distToPlayer > this.meleeAttackRange) {
            return false;
        }

        // orientation ? sense player by vision, sound or smell ?
        if (checkFOV) {
            if (this.meleeAttackHalfFOV < Math.PI) {
                if (!this.inView(this._destinationDir, this.meleeAttackHalfFOV)) {
                    return false;
                }
            }
        }

        return true;
    }

    protected inView(targetDir: vec3, halfFOV: number): boolean {
        const cosFOV = Math.cos(halfFOV);
        const cosFacing = vec3.dot(this._facingDir, targetDir);
        // facing angle < half fov
        return cosFacing > cosFOV;
    }

    /** turn a bit to face destination direction */
    protected turnToFaceDestination() {
        // rotate facing dir
        this._destinationDir.copyTo(MonsterCtrlBehavior._tmpDir);
        MonsterCtrlBehavior._tmpDir.scale(this.turnSpeed * Clock.instance.elapsedTime);
        this._facingDir.add(MonsterCtrlBehavior._tmpDir);
        this._facingDir.normalize();

        // set rotation of owner
        quat.fromLookRotation(this._facingDir, MonsterCtrlBehavior._upDir, this.owner.rotation);
    }
}
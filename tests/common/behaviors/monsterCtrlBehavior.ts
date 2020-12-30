import vec3 from "../../../lib/tsm/vec3.js";
import { ActionControlBehavior, Behavior, Clock, Object3D, RigidBody } from "../../../src/mini3DEngine.js";

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
    public constructor(owner: Object3D, body: RigidBody, actionCtrl: ActionControlBehavior, player: Object3D) {
        super(owner);
        this._body = body;
        this._veloctity = this._body.body.velocity;
        this._actionCtrl = actionCtrl;
        this._player = player;
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

    public attackingActions: number = 1;
    public attackedActions: number = 1;

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

    private static _tmpMyPosition: vec3 = new vec3();
    private static _tmpPlayerPosition: vec3 = new vec3();
    // private static _tmpDir: vec3 = new vec3();

    public start() {

    }

    public update() {
        // const curTime = Clock.instance.curTime;
        // if (curTime - this._lastThinkTime > this.thinkInterval) {
        //     this.think();
        //     this._lastThinkTime = curTime;
        // }

        // facing dir
        this._facingDir.setComponents(0, 0, 0);
        let facingYaw = this.yaw + Math.PI * 0.5;
        this._facingDir.x = Math.cos(facingYaw);
        this._facingDir.z = -Math.sin(facingYaw);

        if (this._player !== null) {
            this.owner.worldTransform.getTranslation(MonsterCtrlBehavior._tmpMyPosition);
            this._player.worldTransform.getTranslation(MonsterCtrlBehavior._tmpPlayerPosition);

            vec3.direction(MonsterCtrlBehavior._tmpMyPosition, MonsterCtrlBehavior._tmpPlayerPosition, this._destinationDir);
            this._distToPlayer = vec3.distance(MonsterCtrlBehavior._tmpMyPosition, MonsterCtrlBehavior._tmpPlayerPosition);
        }

        switch(this._curState) {
            case MonsterState.Idle:
                // set actionCtrl params
                // this._curAction = 0;
                // if player in attack range, attack ?
                if(this.playerInMeleeAttackRange()) {
                    this.attack();
                } else if(this.playerInSight()) {
                    // if player in sight, move ?
                    this.moveTo(MonsterCtrlBehavior._tmpPlayerPosition);
                }
                break;
            case MonsterState.Moving:
                // set actionCtrl params
                // upate destination position
                // turn toward destination position
                // move toward cur facing dir
                // if approached destination position, idle or attack ?
                // refers to cur behavior is patrolling or chasing?
                break;
            case MonsterState.Attacking:
                // set actionCtrl params
                // recover time left
                break;
            case MonsterState.Attacked:
                // set actionCtrl params
                // recover time left
                // if recovered (and player in sense range?), move toward player
                break;
            case MonsterState.Down:
                // set actionCtrl params
                break;
        }
        // this._actionCtrl.actionParams.set("curAction", this._curAction);
    }

    public moveTo(dest: vec3) {
        if (this._curState === MonsterState.Idle || this._curState === MonsterState.Moving) {
            dest.copy(this._destination);
            this._curState = MonsterState.Moving;
            this._actionCtrl.actionParams.set("curAction", MonsterState.Moving);
        }
    }

    public attack() {
        // attack toward current orientation ?
        // if facing player and close enough, player take damage ?
        // if (this._curState === MonsterState.Idle || this._curState === MonsterState.Moving) {
            this._curState = MonsterState.Attacking;
            this._recoverTimeLeft = 1.5;
            // todo: select attack action randomly
            this._actionCtrl.actionParams.set("curAction", this._curState * 100 + Math.round(Math.random() * (this.attackingActions - 1)));
        // }
    }

    public onAttacked() {
        if (this._curState !== MonsterState.Down) {
            this._curState = MonsterState.Attacked;
            this._actionCtrl.actionParams.set("curAction", MonsterState.Attacked);
            this._recoverTimeLeft = 1.0;
            // todo: if hp < 0, down
        }
    }

    public rest() {
        if (this._curState === MonsterState.Idle || this._curState === MonsterState.Moving) {
            this._curState = MonsterState.Idle;
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
}
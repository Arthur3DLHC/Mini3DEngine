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
    public meleeAttackRange: number = 1.0;

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

    // private _lastThinkTime: number = 0;
    // cur state?
    private _curState: MonsterState = MonsterState.Idle;
    /** recover time left for states like attacking, attacked, down */
    private _recoverTimeLeft: number = 0;

    public start() {

    }

    public update() {
        // const curTime = Clock.instance.curTime;
        // if (curTime - this._lastThinkTime > this.thinkInterval) {
        //     this.think();
        //     this._lastThinkTime = curTime;
        // }
        switch(this._curState) {
            case MonsterState.Idle:
                // set actionCtrl params
                // if player in sight, move ?
                break;
            case MonsterState.Moving:
                // set actionCtrl params
                // turn toward destination position
                // move toward destination position
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
                break;
            case MonsterState.Down:
                // set actionCtrl params
                break;
        }
    }

    public moveTo(dest: vec3) {
        if (this._curState === MonsterState.Idle || this._curState === MonsterState.Moving) {
            dest.copy(this._destination);
            this._curState = MonsterState.Moving;
        }
    }

    public attack() {
        // attack toward current orientation ?
        // if facing player and close enough, player take damage ?
        if (this._curState === MonsterState.Idle || this._curState === MonsterState.Moving) {
            this._curState = MonsterState.Attacking;
            this._recoverTimeLeft = 1.5;
            // todo: select attack action randomly
        }
    }

    public onAttacked() {
        if (this._curState === MonsterState.Idle || this._curState === MonsterState.Moving || this._curState === MonsterState.Attacking) {
            this._curState = MonsterState.Attacked;
            this._recoverTimeLeft = 1.0;
            // if hp < 0, down
        }
    }

    public rest() {
        if (this._curState === MonsterState.Idle || this._curState === MonsterState.Moving) {
            this._curState = MonsterState.Idle;
        }
    }
}
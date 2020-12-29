import vec3 from "../../../lib/tsm/vec3.js";
import { ActionControlBehavior, Behavior, Clock, Object3D, RigidBody } from "../../../src/mini3DEngine.js";

export enum MonsterState {
    Idle,
    Moving,
    Attacking,
    GotHit,
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

    private _lastThinkTime: number = 0;
    // cur state?
    private _curState: MonsterState = MonsterState.Idle;

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
                break;
            case MonsterState.Moving:
                break;
            case MonsterState.Attacking:
                break;
            case MonsterState.GotHit:
                break;
            case MonsterState.Down:
                break;
        }
    }

    public moveTo(dest: vec3) {

    }

    public attack() {

    }

    public onAttacked() {

    }

    public rest() {
        
    }
}
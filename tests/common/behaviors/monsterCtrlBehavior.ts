import { ActionControlBehavior, Behavior, Object3D, RigidBody } from "../../../src/mini3DEngine.js";

/**
 * general monster control
 */
export class MonsterCtrlBehavior extends Behavior {
    public constructor(owner: Object3D, body: RigidBody, actionCtrl: ActionControlBehavior) {
        super(owner);
        this._body = body;
        this._veloctity = this._body.body.velocity;
        this._actionCtrl = actionCtrl;
    }

    // movement properties ?
    /** m / s */
    public moveSpeed: number = 1.0;
    /** rad / s */
    public turnSpeed: number = 3.14;

    public allowJump: boolean = false;

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

    // cur state?

    public start() {

    }

    public update() {

    }
}
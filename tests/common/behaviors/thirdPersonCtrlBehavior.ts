import quat from "../../../lib/tsm/quat.js";
import vec2 from "../../../lib/tsm/vec2.js";
import { Behavior, KeyCodes, Object3D, RigidBody } from "../../../src/mini3DEngine.js";

/**
 * third person control, with physics bodys
 * can look and move around, and jump.
 */
export class ThirdPersonCtrlBehavior extends Behavior {
    public constructor(owner: Object3D, body: RigidBody) {
        super(owner);
        this._body = body;
    }


    public mouseSensitivity: number = 0.002;
    public smoothMouse: boolean = true;
    public smoothness: number = 0.25;
    public moveSpeed: number = 1.0;

    public keyForward: number = KeyCodes.w;
    public keyBackward: number = KeyCodes.s;
    public keyLeft: number = KeyCodes.a;
    public keyRight: number = KeyCodes.d;
    public keyJump: number = KeyCodes.Space;

    public yaw: number = 0;
    public pitch: number = 0;

    private _body: RigidBody;

    // calc mouse movement when not using pointer lock API
    private _dragging: boolean = false;
    // private _oldMousePos: vec2 = new vec2();
    private _deltaRot: vec2 = new vec2();

    private _isMovingForward: boolean = false;
    private _isMovingBackward: boolean = false;
    private _isMovingLeft: boolean = false;
    private _isMovingRight: boolean = false;

    private _quatRotYaw: quat = new quat();
    private _quatRotPitch: quat = new quat();

    public update() {

    }
}
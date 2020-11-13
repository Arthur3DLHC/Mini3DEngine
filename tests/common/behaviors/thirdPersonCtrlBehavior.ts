import quat from "../../../lib/tsm/quat.js";
import vec2 from "../../../lib/tsm/vec2.js";
import { Behavior, KeyCodes, Object3D, RigidBody } from "../../../src/mini3DEngine.js";

/**
 * third person control, with physics bodys
 * can look and move around, and jump.
 * reference: https://github.com/schteppe/cannon.js/blob/master/examples/js/PointerLockControls.js
 */
export class ThirdPersonCtrlBehavior extends Behavior {
    public constructor(owner: Object3D, body: RigidBody) {
        super(owner);
        this._body = body;
        this._velocity = this._body.body.velocity;

        body.body.addEventListener("collide", (ev: any) => {
            const contact: CANNON.ContactEquation = ev.contact;
            // todo: check contact normal dir, set canJump flag
            // fix me: what if the player fall down from an edge?

            // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
            // We do not yet know which one is which! Let's check.
            if (contact.bi.id === body.body.id) {       // bi is the player body, flip the contact normal
                contact.ni.negate(this._contactNormal);
            } else {
                this._contactNormal.copy(contact.ni);   // bi is something else. Keep the normal as it is
            }

            // assuming the up vector is always [0, 1, 0]
            if (this._contactNormal.y > 0.5) {
                this._canJump = true;
            }
        });
    }

    public mouseSensitivity: number = 0.002;
    public smoothMouse: boolean = true;
    public smoothness: number = 0.25;
    public moveSpeed: number = 1.0;
    public jumpSpeed: number = 1.0;

    public pointerLock: boolean = false;

    public keyForward: string = "w";
    public keyBackward: string = "s";
    public keyLeft: string = "a";
    public keyRight: string = "d";
    public keyJump: string = " ";

    public yaw: number = 0;
    public pitch: number = 0;

    private _body: RigidBody;
    private _velocity: CANNON.Vec3;     // alias of CANNON.Body.velocity
    private _contactNormal: CANNON.Vec3 = new CANNON.Vec3();    // // Normal in the contact, pointing *out* of whatever the player touched

    // calc mouse movement when not using pointer lock API
    private _dragging: boolean = false;
    // private _oldMousePos: vec2 = new vec2();
    private _deltaRot: vec2 = new vec2();

    private _isMovingForward: boolean = false;
    private _isMovingBackward: boolean = false;
    private _isMovingLeft: boolean = false;
    private _isMovingRight: boolean = false;

    private _canJump: boolean = false;

    private _quatRotYaw: quat = new quat();
    private _quatRotPitch: quat = new quat();

    // keyboard and mouse events
    public onMouseDown(ev: MouseEvent) {
        // left button
        if (ev.button !== 0) {
            return;
        }
        this._dragging = true;
        // this._oldMousePos.x = ev.clientX;
        // this._oldMousePos.y = ev.clientY;
    }

    public onMouseUp(ev: MouseEvent) {
        this._dragging = false;
    }

    public onMouseMove(ev: MouseEvent) {
        if (this.pointerLock || this._dragging) {
            this._deltaRot.x += ev.movementX * this.mouseSensitivity;
            this._deltaRot.y += ev.movementY * this.mouseSensitivity;
        }
    }

    public onKeyDown(ev: KeyboardEvent) {
        switch (ev.key) {
            case this.keyForward:
                this._isMovingForward = true;
                break;
            case this.keyBackward:
                this._isMovingBackward = true;
                break;
            case this.keyLeft:
                this._isMovingLeft = true;
                break;
            case this.keyRight:
                this._isMovingRight = true;
                break;
            case this.keyJump:
                // todo: check whether can jump and set the vertical velocity
                if(this._canJump) {
                    this._velocity.y = this.jumpSpeed;
                }
                this._canJump = false;
                break;
            default:
                break;
        }
    }

    public onKeyUp(ev: KeyboardEvent) {
        switch (ev.key) {
            case this.keyForward:
                this._isMovingForward = false;
                break;
            case this.keyBackward:
                this._isMovingBackward = false;
                break;
            case this.keyLeft:
                this._isMovingLeft = false;
                break;
            case this.keyRight:
                this._isMovingRight = false;
                break;

            default:
                break;
        }
    }

    public update() {
        // look dir
        // move dir
        // apply velocity to rigidbody
    }
}
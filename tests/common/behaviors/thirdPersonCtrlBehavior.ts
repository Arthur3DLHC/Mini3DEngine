import quat from "../../../lib/tsm/quat.js";
import vec2 from "../../../lib/tsm/vec2.js";
import vec3 from "../../../lib/tsm/vec3.js";
import { Behavior, Camera, Clock, KeyCodes, Object3D, RigidBody } from "../../../src/mini3DEngine.js";
import { MouseLookModes } from "./mouseLookModes.js";

/**
 * third person shooter control, with physics bodys
 * can look and move around, and jump.
 * reference: https://github.com/schteppe/cannon.js/blob/master/examples/js/PointerLockControls.js
 * https://github.com/matthias-schuetz/THREE-BasicThirdPersonGame/blob/master/js/game/game.core.demo1.js
 * usage:
 *  attach this behavior to player object, and associate the camera object.
 *  the rigid body pivot need to be under the foot of the player,
 *  and fix the rotation.
 */
export class ThirdPersonCtrlBehavior extends Behavior {
    public constructor(owner: Object3D, body: RigidBody, camera: Camera) {
        super(owner);
        this._body = body;
        this._velocity = this._body.body.velocity;

        this._camera = camera;

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
    public aimMoveSpeed: number = 0.5;
    public jumpSpeed: number = 1.0;

    public allowJump: boolean = false;

    public pointerLock: boolean = false;

    public turnMode: MouseLookModes = MouseLookModes.PointerLock;

    public keyForward: string = "w";
    public keyBackward: string = "s";
    public keyLeft: string = "a";
    public keyRight: string = "d";
    public keyJump: string = " ";
    public keyAim: string = "f";

    public yaw: number = 0;
    public pitch: number = 0;

    public get moveYaw(): number {return this._moveYaw;}
    public get modelYaw(): number {return this._modelYaw;}

    public get isAiming(): boolean { return this._isAiming; }

    // todo: some state properties for animation state machine.
    // ismoving, isjumping, iscrouching? isAiming?
    // todo: shooting animation

    // corresponding action states and conditions

    // todo: hit by monsters, down, dead...
    // hit recover time...
    // use a 'cur state recover time' variable?

    // todo: interaction with scene objects: use, climb ladders...

    /**
     * camera horizontal offset from rigid body pivot
     */
    public cameraHorizontalOffset: vec3 = new vec3([0.5, 0.0, 0.5]);

    /** the scale of camera horizontal offset */
    public cameraHorizontalOffsetScale: number = 1;

    /** limits of camera horizontal offset scale */
    public minCameraHorizontalOffsetScale: number = 0.5;
    public maxCameraHorizontalOffsetScale: number = 2;

    /**
     * camera vertical offset from rigid body pivot
     */
    public cameraVerticalOffset: number = 1.5;

    public get horizVelocity(): vec3 {return this._horizVelocity;}

    private _moveYaw: number = 0;
    private _modelYaw: number = 0;

    private _camera: Camera;
    private _cameraGlobalOffset: vec3 = new vec3();

    private _horizVelocity: vec3 = new vec3();

    private _body: RigidBody;
    private _velocity: CANNON.Vec3;     // alias of CANNON.Body.velocity
    private _contactNormal: CANNON.Vec3 = new CANNON.Vec3();    // // Normal in the contact, pointing *out* of whatever the player touched

    // calc mouse movement when not using pointer lock API
    private _dragging: boolean = false;
    // private _oldMousePos: vec2 = new vec2();
    private _deltaRot: vec2 = new vec2();

    protected _isMovingForward: boolean = false;
    protected _isMovingBackward: boolean = false;
    protected _isMovingLeft: boolean = false;
    protected _isMovingRight: boolean = false;

    private _isAiming: boolean = false;

    private _canJump: boolean = false;

    private _upVec: vec3 = new vec3([0, 1, 0]);

    // keyboard and mouse events
    public onMouseDown(ev: MouseEvent) {
        // left button
        if (ev.button !== 0) {
            return;
        }
        if(this.turnMode === MouseLookModes.Drag) this._dragging = true;
        // this._oldMousePos.x = ev.clientX;
        // this._oldMousePos.y = ev.clientY;
    }

    public onMouseUp(ev: MouseEvent) {
        this._dragging = false;
    }

    public onMouseMove(ev: MouseEvent) {
        if ((this.turnMode === MouseLookModes.PointerLock && this.pointerLock) || (this.turnMode === MouseLookModes.Drag && this._dragging)) {
            this._deltaRot.x += ev.movementX * this.mouseSensitivity;
            this._deltaRot.y += ev.movementY * this.mouseSensitivity;
        }
    }

    public onMouseWheel(ev: WheelEvent) {
        // todo: change camera offset distance
        this.cameraHorizontalOffsetScale += ev.deltaY / 500;
        this.cameraHorizontalOffsetScale = Math.max(this.minCameraHorizontalOffsetScale, Math.min(this.cameraHorizontalOffsetScale, this.maxCameraHorizontalOffsetScale));
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
                if(this._canJump && this.allowJump) {
                    this._velocity.y = this.jumpSpeed;
                }
                this._canJump = false;
                break;
            case this.keyAim:
                this._isAiming = !this._isAiming;
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
        // fix me: character orientation and camera orientation is not same
        // who is parent? camera or character?
        // or do not make them parent-child
        // attach this behavior to player
        // 1. calculate the global look orientation,
        // 2. calculate player orientation from global look orientation and cur move dir
        // 3. assign move speed to player rigidbody
        // 4. calculate the camera orientation directly from global look orientation
        // 5. calculate the camera position from player position (in last frame?)
        // 6. the player rigidbody will upate positon of player in this frame

        // look dir
        this.yaw -= this._deltaRot.x * this.smoothness;
        this.pitch -= this._deltaRot.y * this.smoothness;

        this._deltaRot.x -= this._deltaRot.x * this.smoothness;
        this._deltaRot.y -= this._deltaRot.y * this.smoothness;

        // todo: pitch limit property

        if (this.pitch > 1.56) {
            this.pitch = 1.56;
        }
        if (this.pitch < -1.56) {
            this.pitch = -1.56;
        }

        // camera orientation
        quat.fromEuler( this.pitch, this.yaw, 0, "YXZ", this._camera.rotation);
        
        let isMoving = false;
        if (this._isMovingForward) {
            //this._moveYaw = 90;
            this._moveYaw = 0;
            isMoving = true;
        }
        if (this._isMovingBackward) {
            //this._moveYaw = -90;
            this._moveYaw = 180;
            isMoving = true;
        }
        if (this._isMovingLeft) {
            //this._moveYaw = 180;
            this._moveYaw = 90;
            isMoving = true;
        }
        if (this._isMovingRight) {
            //this._moveYaw = 0;
            this._moveYaw = -90;
            isMoving = true;
        }

        if (this._isMovingForward && this._isMovingLeft) {
            //this._moveYaw = 135;
            this._moveYaw = 45;
        }
        if (this._isMovingForward && this._isMovingRight) {
            //this._moveYaw = 45;
            this._moveYaw = -45;
        }
        if (this._isMovingBackward && this._isMovingLeft) {
            //this._moveYaw = -135;
            this._moveYaw = 135;
        }
        if (this._isMovingBackward && this._isMovingRight) {
            //this._moveYaw = -45;
            this._moveYaw = -135;
        }

        this._moveYaw = this._moveYaw * Math.PI / 180.0;
        this._moveYaw += this.yaw;

        // horiz velocity
        this._horizVelocity.x = 0;
        this._horizVelocity.y = 0;
        this._horizVelocity.z = 0;

        if (isMoving) {

            this._horizVelocity.x = this.moveSpeed * Math.cos(this._moveYaw + Math.PI * 0.5);
            this._horizVelocity.z = -this.moveSpeed * Math.sin(this._moveYaw + Math.PI * 0.5);

            // player orientation
            // face to move direction
            // because model is init facing z axis, so it's 90 degree offset with move yaw angle
            const modelYaw = this._moveYaw;// + Math.PI * 0.5;

            if(Math.abs(this._modelYaw - modelYaw) > Math.PI) {
                if (this._modelYaw > modelYaw) {
                    this._modelYaw -= Math.PI * 2;
                } else {
                    this._modelYaw += Math.PI * 2;
                }
            }

            const yawThreshold = 5.0 * Clock.instance.elapsedTime;// 0.1;
            const turnAmount = 2 * Math.PI * Clock.instance.elapsedTime;

            if(this._modelYaw < modelYaw - yawThreshold) {
                this._modelYaw += turnAmount;
            } else if (this._modelYaw > modelYaw + yawThreshold) {
                this._modelYaw -= turnAmount;
            } else {
                this._modelYaw = modelYaw;
            }

            quat.fromAxisAngle(this._upVec, this._modelYaw + Math.PI, this.owner.rotation);
        }

        if (this._isAiming) {
            const rate = this.aimMoveSpeed / this.moveSpeed;

            this._horizVelocity.x *= rate;
            this._horizVelocity.z *= rate;
            this._modelYaw = this.yaw;
            quat.fromAxisAngle(this._upVec, this._modelYaw + Math.PI, this.owner.rotation);
        }

        // apply horizontal velocty to rigid body
        this._velocity.x = this._horizVelocity.x;
        this._velocity.z = this._horizVelocity.z;

        // calc camera position from player position and view direction
        // 1 frame later than player?

        // rotate about origin point [0,0,0], under the foot
        this._camera.rotation.multiplyVec3(this.cameraHorizontalOffset, this._cameraGlobalOffset);
        
        this._cameraGlobalOffset.scale(this.cameraHorizontalOffsetScale);

        // move up to shoulder
        this._cameraGlobalOffset.y += this.cameraVerticalOffset;

        this.owner.translation.copy(this._camera.translation);
        this._camera.translation.add(this._cameraGlobalOffset);

        // todo: camera collision with scene
    }
}
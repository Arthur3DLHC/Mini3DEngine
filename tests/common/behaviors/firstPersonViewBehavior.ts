import { Behavior, Object3D, KeyCodes, Clock } from "../../../src/mini3DEngine.js";
import vec2 from "../../../lib/tsm/vec2.js";
import vec3 from "../../../lib/tsm/vec3.js";
import mat4 from "../../../lib/tsm/mat4.js";

/**
 * unreal like first-person view controller, no physics. only for nevagating 3D scenes
 */
export class FirstPersonViewBehavior extends Behavior {
    public get typeName(): string {
        return "FirstPersonViewBehavior";
    }
    public isA(typeName: string): boolean {
        if(typeName === "FirstPersonViewBehavior") return true;
        return super.isA(typeName);
    }
    public constructor(owner: Object3D) {
        super(owner);
        this.mouseSensitivity = 0.002;
        this.smoothMouse = true;
        this.smoothness = 0.25;
        this.yaw = 0;
        this.pitch = 0;
        this.moveDir = new vec3();
        this.position = new vec3();
        this.moveSpeed = 1.0;

        this.keyForward = "w"; // KeyCodes.w;
        this.keyBackward = "s"; //KeyCodes.s;
        this.keyLeft = "a"; //KeyCodes.a;
        this.keyRight = "d"; //KeyCodes.d;
        this.keyUp = "q"; //KeyCodes.q;
        this.keyDown = "e"; //KeyCodes.e;

        this.pointerLock = false;

        this._isMovingForward = false;
        this._isMovingBackward = false;
        this._isMovingLeft = false;
        this._isMovingRight = false;
        this._isMovingUp = false;
        this._isMovingDown = false;

        this._dragging = false;
        // this._oldMousePos = new vec2();
        this._deltaRot = new vec2();
        this._matRotYaw = mat4.identity.copyTo();
        this._matRotPitch = mat4.identity.copyTo();
    }

    public mouseSensitivity: number;
    public smoothMouse: boolean;
    public smoothness: number;
    public moveSpeed: number;

    public keyForward: string;
    public keyBackward: string;
    public keyLeft: string;
    public keyRight: string;
    public keyUp: string;
    public keyDown: string;

    public yaw: number;
    public pitch: number;
    public moveDir: vec3;
    public position: vec3;

    public pointerLock: boolean;

    private _dragging: boolean;
    // private _oldMousePos: vec2;
    private _deltaRot: vec2;
    
    private _isMovingForward: boolean;
    private _isMovingBackward: boolean;
    private _isMovingLeft: boolean;
    private _isMovingRight: boolean;
    private _isMovingUp: boolean;
    private _isMovingDown: boolean;

    private _matRotYaw: mat4;
    private _matRotPitch: mat4;

    // keyboard and mouse input event handlers
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
        // if (!this._dragging) {
        //     return;
        // }

        // this._deltaRot.x += (ev.clientX - this._oldMousePos.x) * this.mouseSensitivity;
        // this._deltaRot.y += (ev.clientY - this._oldMousePos.y) * this.mouseSensitivity;

        // this._oldMousePos.x = ev.clientX;
        // this._oldMousePos.y = ev.clientY;
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
            case this.keyUp:
                this._isMovingUp = true;
                break;
            case this.keyDown:
                this._isMovingDown = true;
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
            case this.keyUp:
                this._isMovingUp = false;
                break;
            case this.keyDown:
                this._isMovingDown = false;
                break;
            default:
                break;
        }
    }

    public update() {
        this.yaw -= this._deltaRot.x * this.smoothness;
        this.pitch -= this._deltaRot.y * this.smoothness;

        this._deltaRot.x -= this._deltaRot.x * this.smoothness;
        this._deltaRot.y -= this._deltaRot.y * this.smoothness;

        if (this.pitch > 1.56) {
            this.pitch = 1.56;
        }
        if (this.pitch < -1.56) {
            this.pitch = -1.56;
        }

        // compute rotation matrix
        this._matRotYaw.fromYRotation(this.yaw);
        this._matRotPitch.fromXRotation(this.pitch);
        
        mat4.product(this._matRotYaw, this._matRotPitch, this.owner.localTransform);

        // compute move dir in local space
        this.moveDir.x = 0;
        this.moveDir.y = 0;
        this.moveDir.z = 0;
        if (this._isMovingForward) {
            this.moveDir.z = -1;
        } else if (this._isMovingBackward) {
            this.moveDir.z = 1;
        }
        if (this._isMovingLeft) {
            this.moveDir.x = -1;
        } else if (this._isMovingRight) {
            this.moveDir.x = 1;
        }
        if (this._isMovingUp) {
            this.moveDir.y = 1;
        } else if (this._isMovingDown) {
            this.moveDir.y = -1;
        }
        this.moveDir.normalize();

        this.owner.localTransform.multiplyVec3(this.moveDir, this.moveDir);

        this.position.add(this.moveDir.scale(Clock.instance.elapsedTime * this.moveSpeed));

        // todo: update local transform of owner
        this.owner.localTransform.setTranslation(this.position);
    }
}
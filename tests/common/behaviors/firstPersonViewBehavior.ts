import { Behavior, Object3D, KeyCodes } from "../../../src/miniEngine.js";
import vec2 from "../../../lib/tsm/vec2.js";
import vec3 from "../../../lib/tsm/vec3.js";
import mat4 from "../../../lib/tsm/mat4.js";

export class FirstPersonViewBehavior extends Behavior {
    public constructor(owner: Object3D) {
        super(owner);
        this.mouseSensitivity = 0.002;
        this.smoothMouse = true;
        this.smoothness = 0.25;
        this.yaw = 0;
        this.pitch = 0;
        this.moveDir = new vec3();

        this.keyForward = KeyCodes.w;
        this.keyBackward = KeyCodes.s;
        this.keyLeft = KeyCodes.a;
        this.keyRight = KeyCodes.d;
        this.keyUp = KeyCodes.q;
        this.keyDown = KeyCodes.e;

        this.isMovingForward = false;
        this.isMovingBackward = false;
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.isMovingUp = false;
        this.isMovingDown = false;

        this._dragging = false;
        this._oldMousePos = new vec2();
        this._deltaRot = new vec2();
        this._matRotYaw = mat4.identity.copy();
        this._matRotPitch = mat4.identity.copy();
    }

    public mouseSensitivity: number;
    public smoothMouse: boolean;
    public smoothness: number;

    public keyForward: number;
    public keyBackward: number;
    public keyLeft: number;
    public keyRight: number;
    public keyUp: number;
    public keyDown: number;

    public yaw: number;
    public pitch: number;
    public moveDir: vec3;

    private _dragging: boolean;
    private _oldMousePos: vec2;
    private _deltaRot: vec2;
    
    private isMovingForward: boolean;
    private isMovingBackward: boolean;
    private isMovingLeft: boolean;
    private isMovingRight: boolean;
    private isMovingUp: boolean;
    private isMovingDown: boolean;

    private _matRotYaw: mat4;
    private _matRotPitch: mat4;

    // todo: keyboard and mouse input event handlers
    public onMouseDown(ev: MouseEvent) {
        // left button
        if (ev.button !== 0) {
            return;
        }
        this._dragging = true;
        this._oldMousePos.x = ev.clientX;
        this._oldMousePos.y = ev.clientY;
    }

    public onMouseUp(ev: MouseEvent) {
        this._dragging = false;
    }

    public onMouseMove(ev: MouseEvent) {
        if (!this._dragging) {
            return;
        }

        this._deltaRot.x += (ev.clientX - this._oldMousePos.x) * this.mouseSensitivity;
        this._deltaRot.y += (ev.clientY - this._oldMousePos.y) * this.mouseSensitivity;

        this._oldMousePos.x = ev.clientX;
        this._oldMousePos.y = ev.clientY;
    }

    public onKeyDown(ev: KeyboardEvent) {
        switch (ev.keyCode) {
            case this.keyForward:
                this.isMovingForward = true;
                break;
            case this.keyBackward:
                this.isMovingBackward = true;
                break;
            case this.keyLeft:
                this.isMovingLeft = true;
                break;
            case this.keyRight:
                this.isMovingRight = true;
                break;
            case this.keyUp:
                this.isMovingUp = true;
                break;
            case this.keyDown:
                this.isMovingDown = true;
                break;
            default:
                break;
        }
    }

    public onKeyUp(ev: KeyboardEvent) {
        switch (ev.keyCode) {
            case this.keyForward:
                this.isMovingForward = false;
                break;
            case this.keyBackward:
                this.isMovingBackward = false;
                break;
            case this.keyLeft:
                this.isMovingLeft = false;
                break;
            case this.keyRight:
                this.isMovingRight = false;
                break;
            case this.keyUp:
                this.isMovingUp = false;
                break;
            case this.keyDown:
                this.isMovingDown = false;
                break;
            default:
                break;
        }
    }

    public update() {
        this.yaw += this._deltaRot.x * this.smoothness;
        this.pitch += this._deltaRot.y * this.smoothness;

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

        // todo: compute move dir in local space
        this.moveDir.x = 0;
        this.moveDir.y = 0;
        this.moveDir.z = 0;
        if (this.isMovingForward) {
            this.moveDir.z = -1;
        } else if (this.isMovingBackward) {
            this.moveDir.z = 1;
        }
        if (this.isMovingLeft) {
            this.moveDir.x = -1;
        } else if (this.isMovingRight) {
            this.moveDir.x = 1;
        }
        if (this.isMovingUp) {
            this.moveDir.y = 1;
        } else if (this.isMovingDown) {
            this.moveDir.y = -1;
        }

        // todo: update local transform of owner
        this.owner.localTransform.translate(this.moveDir);
    }
}
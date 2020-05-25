import { Behavior, Object3D } from "../../../src/miniEngine.js";
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
        this._dragging = false;
        this._oldMousePos = new vec2();
        this._deltaRot = new vec2();
        this._matRotYaw = mat4.identity.copy();
        this._matRotPitch = mat4.identity.copy();
    }

    public mouseSensitivity: number;
    public smoothMouse: boolean;
    public smoothness: number;

    public yaw: number;
    public pitch: number;
    public moveDir: vec3;

    private _dragging: boolean;
    private _oldMousePos: vec2;
    private _deltaRot: vec2;

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

    }

    public onKeyUp(ev: KeyboardEvent) {
        
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


        // todo: update local transform of owner
        this.owner.localTransform.translate(this.moveDir);
    }
}
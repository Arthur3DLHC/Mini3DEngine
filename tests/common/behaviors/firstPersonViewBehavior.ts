import { Behavior, Object3D } from "../../../src/miniEngine.js";
import vec2 from "../../../lib/tsm/vec2.js";

export class FirstPersonViewBehavior extends Behavior {
    public constructor(owner: Object3D) {
        super(owner);
        this.mouseSensitivity = 0.002;
        this.smoothMouse = true;
        this.smoothness = 0.25;
        this.yaw = 0;
        this.pitch = 0;
        this._dragging = false;
        this._oldPos = new vec2();
        this._deltaRot = new vec2();
    }

    public mouseSensitivity: number;
    public smoothMouse: boolean;
    public smoothness: number;

    public yaw: number;
    public pitch: number;

    private _dragging: boolean;
    private _oldPos: vec2;
    private _deltaRot: vec2;

    // todo: keyboard and mouse input event handlers
    public onMouseDown(ev: MouseEvent) {
        // left button
        if (ev.button !== 0) {
            return;
        }
        this._dragging = true;
        this._oldPos.x = ev.clientX;
        this._oldPos.y = ev.clientY;
    }

    public onMouseUp(ev: MouseEvent) {
        this._dragging = false;
    }

    public onMouseMove(ev: MouseEvent) {
        if (!this._dragging) {
            return;
        }

        this._deltaRot.x += (ev.clientX - this._oldPos.x) * this.mouseSensitivity;
        this._deltaRot.y += (ev.clientY - this._oldPos.y) * this.mouseSensitivity;

        this._oldPos.x = ev.clientX;
        this._oldPos.y = ev.clientY;
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

        // todo: compute position

        // todo: update local transform of owner

    }
}
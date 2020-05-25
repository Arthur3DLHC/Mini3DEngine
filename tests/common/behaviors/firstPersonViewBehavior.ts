import { Behavior, Object3D } from "../../../src/miniEngine.js";

export class FirstPersonViewBehavior extends Behavior {
    public constructor(owner: Object3D) {
        super(owner);
        this.smoothMouse = true;
        this.smoothment = 0.5;
        this._dragging = false;
    }

    public smoothMouse: boolean;
    public smoothment: number;

    private _dragging: boolean;

    // todo: keyboard and mouse input event handlers
    public onMouseDown(ev: MouseEvent) {

    }

    public onMouseUp(ev: MouseEvent) {

    }

    public onMouseMove(ev: MouseEvent) {

    }

    public onKeyDown(ev: KeyboardEvent) {

    }

    public onKeyUp(ev: KeyboardEvent) {
        
    }
}
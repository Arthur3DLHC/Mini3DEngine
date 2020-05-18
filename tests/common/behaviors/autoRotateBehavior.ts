import { Object3D, Clock, Behavior } from "../../../src/miniEngine.js";
import mat4 from "../../../lib/tsm/mat4.js";

export class AutoRotateBehavior extends Behavior {
    public constructor(owner: Object3D) {
        super(owner);
    }

    // radians
    private _curYaw: number = 0;
    private _curPitch: number = 0;

    public update() {
        const elapsed = Clock.instance.elapsedTime;
        this._curYaw += elapsed;
        this._curPitch += elapsed * 0.2;

        // calculate transform matrix
        const matYaw: mat4 = new mat4();
        const matPitch: mat4 = new mat4();
        matYaw.fromYRotation(this._curYaw);
        matPitch.fromXRotation(this._curPitch);
        mat4.product(matPitch, matYaw, this.owner.localTransform);
    }
}
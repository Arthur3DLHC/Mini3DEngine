import { Object3D, Clock, Behavior } from "../../../src/mini3DEngine.js";
import mat4 from "../../../lib/tsm/mat4.js";

export class AutoRotateBehavior extends Behavior {
    public get typeName(): string {
        return "AutoRotateBehavior";
    }
    public constructor(owner: Object3D) {
        super(owner);
    }

    // radians
    private _curYaw: number = 0;
    private _curPitch: number = 0;

    public update() {
        const elapsed = Clock.instance.elapsedTime;
        this._curYaw += elapsed * 0.2;
        this._curPitch += elapsed * 0.1;

        // calculate transform matrix
        const matYaw: mat4 = new mat4();
        const matPitch: mat4 = new mat4();
        matYaw.fromYRotation(this._curYaw);
        matPitch.fromXRotation(this._curPitch);
        mat4.product(matPitch, matYaw, this.owner.localTransform);
    }
}
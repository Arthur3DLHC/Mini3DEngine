import mat4 from "../../../lib/tsm/mat4.js";
import vec3 from "../../../lib/tsm/vec3.js";
import { Clock } from "../../scene/clock.js";
import { BaseConstraint } from "./baseConstraint.js";

/**
 * spring constraint
 */
export class SpringConstraint extends BaseConstraint {
    public enable: boolean = true;
    /** spring effect on rotation or translation? */
    public rotation: boolean = true;
    /** length form spring head to tail */
    // public springLength: number = 0.1;
    /** bouncy */
    public stiffness: number = 0.5;
    /** speed */
    public damp: number = 1.0;
    /** gravity */
    public gravity: number = 0.0;

    public localTailPosition: vec3 = new vec3([0, 0, 0.1]);
    public localUpDir: vec3 = new vec3([0, 1, 0]);

    /** 'head' is the 'root' of the bone */
    private _curHeadPosition: vec3 = new vec3();
    /** 'tail' is the 'end' or 'tip' of the bone */
    private _curTailPosition: vec3 = new vec3();

    /** 'head' is the 'root' of the bone */
    private _expectHeadPosition: vec3 = new vec3();
    /** 'tail' is the 'end' or 'tip' of the bone */
    private _expectTailPosition: vec3 = new vec3();

    /** 'head' is the 'root' of the bone */
    private _headSpeed: vec3 = new vec3();
    /** 'tail' is the 'end' or 'tip' of the bone */
    private _tailSpeed: vec3 = new vec3();

    private static _tmpVec: vec3 = new vec3();

    // private static _localEndPoint: vec3 = new vec3();
    // private static _localUpDir: vec3 = new vec3([0, 1, 0]);

    public start() {
        this.calcExpectPoints();
        this._expectHeadPosition.copyTo(this._curHeadPosition);
        this._expectTailPosition.copyTo(this._curTailPosition);
        SpringConstraint._tmpVec.reset();
        this._headSpeed.reset();
        this._tailSpeed.reset();
    }

    public update() {
        // this constraint will work after owner.worldTransform matrix updated,
        // and before children update

        // get the expected head and tail position of the bone
        this.calcExpectPoints();

        const elapsedTime = Clock.instance.elapsedTime;

        // move cur head and tail position toward them

        // alias
        const accel = SpringConstraint._tmpVec;

        this._expectTailPosition.copyTo(accel);
        accel.subtract(this._curTailPosition);
        // fix me: multiply accel by elapsed time?
        accel.scale(this.stiffness * elapsedTime);
        this._tailSpeed.add(accel);
        this._tailSpeed.scale(this.damp);

        // fix me: multiply position by elapsed time?
        const offset = SpringConstraint._tmpVec;

        this._tailSpeed.copyTo(offset);
        offset.scale(Clock.instance.elapsedTime);

        this._curTailPosition.add(offset);

        // todo: look from expect head to cur tail
        // calculate worldTransform
        // will not affect local rotation scale translation?
        const boneUpWorld = SpringConstraint._tmpVec;
        this.owner.worldTransform.multiplyVec3Normal(this.localUpDir, boneUpWorld);

        mat4.lookAt(this._expectHeadPosition, this._curTailPosition, boneUpWorld, this.owner.worldTransform);
    }

    private calcExpectPoints() {
        // worldTransform has been updated already
        this.owner.worldTransform.getTranslation(this._expectHeadPosition);
        // fix me: which axis is the bone alonging in blender?
        this.owner.worldTransform.multiplyVec3(this.localTailPosition, this._expectTailPosition);
    }
}
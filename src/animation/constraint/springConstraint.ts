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

    public localEndPoint: vec3 = new vec3([0, 0, 0.1]);
    public localUpDir: vec3 = new vec3([0, 1, 0]);

    private _curStartPoint: vec3 = new vec3();
    private _curEndPoint: vec3 = new vec3();

    private _wishStartPoint: vec3 = new vec3();
    private _wishEndPoint: vec3 = new vec3();

    private _curStartSpeed: vec3 = new vec3();
    private _curEndSpeed: vec3 = new vec3();

    private static _tmpOffset: vec3 = new vec3();

    // private static _localEndPoint: vec3 = new vec3();
    // private static _localUpDir: vec3 = new vec3([0, 1, 0]);

    public init() {
        this.calcWishPoints();
        this._wishStartPoint.copyTo(this._curStartPoint);
        this._wishEndPoint.copyTo(this._curEndPoint);
        SpringConstraint._tmpOffset.reset();
        this._curStartSpeed.reset();
        this._curEndSpeed.reset();
    }

    // fix me: are constraints behaviors?
    public update() {
        // this constraint will work after owner.worldTransform matrix updated

        // get the start point and end point of the bone
        this.calcWishPoints();

        // move cur start and end point toward them
        this._wishEndPoint.copyTo(SpringConstraint._tmpOffset);
        SpringConstraint._tmpOffset.subtract(this._curEndPoint);
        SpringConstraint._tmpOffset.scale(this.stiffness);
        this._curEndSpeed.add(SpringConstraint._tmpOffset);
        this._curEndSpeed.scale(this.damp);

        // fix me: multiply by elapsed time?
        this._curEndSpeed.copyTo(SpringConstraint._tmpOffset);
        SpringConstraint._tmpOffset.scale(Clock.instance.elapsedTime);

        this._curEndPoint.add(SpringConstraint._tmpOffset);

        // todo: look from withstartpoint to curendpoint
    }

    private calcWishPoints() {
        this.owner.worldTransform.getTranslation(this._wishStartPoint);
        // fix me: which axis is the bone alonging in blender?
        // SpringConstraint._localEndPoint.x = 0;
        // SpringConstraint._localEndPoint.y = 0;
        // SpringConstraint._localEndPoint.z = this.springLength;
        this.owner.worldTransform.multiplyVec3(this.localEndPoint, this._wishEndPoint);
    }
}
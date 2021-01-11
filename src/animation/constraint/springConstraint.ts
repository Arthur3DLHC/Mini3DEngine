import mat4 from "../../../lib/tsm/mat4.js";
import vec3 from "../../../lib/tsm/vec3.js";
import { Clock } from "../../scene/clock.js";
import { BaseConstraint } from "./baseConstraint.js";

/**
 * spring constraint
 */
export class SpringConstraint extends BaseConstraint {
    public get enable(): boolean { return super.enable; }
    public set enable(val: boolean) {
        super.enable = val;
        if (!val) {
            this._started = false;
        }
    }
    /** spring effect on rotation or translation? */
    public get rotation(): boolean {return this._rotation;}
    public set rotation(val: boolean) {
        if (this._rotation !== val) {
            this._rotation = val;
            this._started = false;  // need to reset
        }
    }
    /** length form spring head to tail */
    // public springLength: number = 0.1;
    /** bouncy */
    public stiffness: number = 0.7;
    /** speed */
    public damp: number = 0.5;
    /** gravity */
    public gravity: number = 0.0;

    /** the bone default tail axis is +y in blender; swap y-z and nagate */
    public localTailPosition: vec3 = new vec3([0, 0, -0.1]);
    /** the bone default up axis is +z in blender; swap y-z here */
    public localUpDir: vec3 = new vec3([0, 1, 0]);

    public maxDistance: number = 1;

    private _rotation: boolean = true;
    // private _curHeadPosition: vec3 = new vec3();

    /** 
     * cur head (translation mode) or tail (rotation mode) position
     * 'head' is the 'root' of the bone
     * 'tail' is the 'end' or 'tip' of the bone
     */
    private _curPosition: vec3 = new vec3();

    /** 'head' is the 'root' of the bone */
    private _expectHeadPosition: vec3 = new vec3();
    /** 'tail' is the 'end' or 'tip' of the bone */
    private _expectTailPosition: vec3 = new vec3();

    /** 'head' is the 'root' of the bone */
    // private _headSpeed: vec3 = new vec3();

    /** 
     * cur head (translation mode) or tail (rotation mode) speed
     * 'head' is the 'root' of the bone
     * 'tail' is the 'end' or 'tip' of the bone
     */
    private _curSpeed: vec3 = new vec3();

    private static _tmpVec: vec3 = new vec3();

    private _started: boolean = false;

    // private static _localEndPoint: vec3 = new vec3();
    // private static _localUpDir: vec3 = new vec3([0, 1, 0]);

    // fix me: when to call start()
    public start() {
        this.calcExpectPoints();
        if (this.rotation) {
            this._expectTailPosition.copyTo(this._curPosition);
        } else {
            this._expectHeadPosition.copyTo(this._curPosition);
        }
        SpringConstraint._tmpVec.reset();
        this._curSpeed.reset();
        this._started = true;
    }

    public update() {
        // this constraint will work after owner.worldTransform matrix updated,
        // and before children update.
        // so if a chain of bones all have spring constraint, they can be affected from parent to child one by one.
        if (!this._started) {
            this.start();
        }

        // get the expected head and tail position of the bone
        this.calcExpectPoints();

        // const elapsedTime = Math.min(0.1, Clock.instance.elapsedTime);

        // move cur head and tail position toward them
        // https://github.com/artellblender/springbones/blob/master/spring_bones.py
        // note: the head and tail have different meaning in reference code:
        // head = cur tail posiiton
        // tail = expected tail position

        // alias
        const accel = SpringConstraint._tmpVec;

        this._expectTailPosition.copyTo(accel);
        accel.subtract(this._curPosition);
        accel.scale(this.stiffness);

        this._curSpeed.add(accel);
        this._curSpeed.scale(this.damp);

        // const offset = SpringConstraint._tmpVec;

        // this._tailSpeed.copyTo(offset);
        // offset.scale(elapsedTime);

        this._curPosition.add(this._curSpeed);

        // prevent too far or NAN?
        let error = false;
        if (isNaN(this._curPosition.x) || isNaN(this._curPosition.y) || isNaN(this._curPosition.z)) {
            error = true;
        } else {
            if( vec3.distance(this._expectTailPosition, this._curPosition) > this.maxDistance ) {
                error = true;
            }
        }

        if (error) {
            this._expectTailPosition.copyTo(this._curPosition);
            this._curSpeed.setComponents(0, 0, 0);
        }

        if (this.rotation) {
            // todo: look from expect head to cur tail
            // calculate worldTransform
            // will not affect local rotation scale translation?
            const boneUpWorld = SpringConstraint._tmpVec;
            this.owner.worldTransform.multiplyVec3Normal(this.localUpDir, boneUpWorld);

            mat4.lookAtInverse(this._expectHeadPosition, this._curPosition, boneUpWorld, this.owner.worldTransform);
        } else {
            // set translation?
            this.owner.worldTransform.setTranslation(this._curPosition);
        }
    }

    private calcExpectPoints() {
        // worldTransform has been updated already
        this.owner.worldTransform.getTranslation(this._expectHeadPosition);
        // fix me: which axis is the bone alonging in blender?
        this.owner.worldTransform.multiplyVec3(this.localTailPosition, this._expectTailPosition);
    }
}
/// <reference path = "../../tsDefinitions/cannon.d.ts" />
import quat from "../../lib/tsm/quat.js";
import vec3 from "../../lib/tsm/vec3.js";
import { Object3D } from "../scene/object3D.js";
import { MathConverter } from "./mathConverter.js";
import { PhysicsBehavior } from "./physicsBehavior.js";
import { PhysicsWorld } from "./physicsWorld.js";

export class RigidBody extends PhysicsBehavior {
    public constructor(owner: Object3D, physicsWorld: PhysicsWorld, option?: CANNON.IBodyOptions) {
        super(owner, physicsWorld);
        
        this._body = new CANNON.Body(option);
    }

    public get body(): CANNON.Body {return this._body;}

    private _body: CANNON.Body;

    public getPosition(dest: vec3) {
        dest.setComponents(this._body.position.x, this._body.position.y, this._body.position.z);
    }
    public setPosition(val: vec3) {
        this._body.position.set(val.x, val.y, val.z);
    }

    public getRotation(dest: quat) {
        dest.setComponents(this._body.quaternion.x, this._body.quaternion.y, this._body.quaternion.z, this._body.quaternion.w);
    }

    public setRotation(val: quat) {
        this._body.quaternion.set(val.x, val.y, val.z, val.w);
    }

    // encapsulate a cannon.es Body object ?
    public update() {
        // todo: copy the position and rotation to owner object
        if (this.body !== null && this.body.mass > 0) {
            MathConverter.CannonToTSMQuat(this.body.quaternion, this.owner.rotation);
            MathConverter.CannonToTSMVec3(this.body.position, this.owner.translation);
        }
    }
}
/// <reference path = "../../tsDefinitions/cannon.d.ts" />
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

    // encapsulate a cannon.es Body object ?
    public update() {
        // todo: copy the position and rotation to owner object
        if (this.body !== null) {
            MathConverter.CannonToTSMQuat(this.body.quaternion, this.owner.rotation);
            MathConverter.CannonToTSMVec3(this.body.position, this.owner.translation);
        }
    }
}
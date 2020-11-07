/// <reference path = "../../tsDefinitions/cannon-es.d.ts" />
import * as Cannon from "cannon-es";
import { MathConverter } from "./mathConverter.js";
import { PhysicsBehavior } from "./physicsBehavior.js";

export class RigidBody extends PhysicsBehavior {
    public body: Cannon.Body | null = null;

    // encapsulate a cannon.es Body object ?
    public update() {
        // todo: copy the position and rotation to owner object
        if (this.body !== null) {
            MathConverter.CannonToTSMQuat(this.body.quaternion, this.owner.rotation);
            MathConverter.CannonToTSMVec3(this.body.position, this.owner.translation);
        }
    }
}
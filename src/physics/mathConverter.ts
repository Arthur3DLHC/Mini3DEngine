/// <reference path = "../../tsDefinitions/cannon-es.d.ts" />
import * as Cannon from "cannon-es";
import quat from "../../lib/tsm/quat.js";
import vec3 from "../../lib/tsm/vec3.js";

/**
 * physics math types <-> TMS math types
 */
export class MathConverter {
    public static CannonToTSMVec3(src: Cannon.Vec3, dest: vec3) {
        // dest.x = src.x; dest.y = src.y; dest.z = src.z;
        dest.setComponents(src.x, src.y, src.z);
    }

    public static CannonToTSMQuat(src: Cannon.Quaternion, dest: quat) {
        dest.setComponents(src.x, src.y, src.z, src.w);
    }
}
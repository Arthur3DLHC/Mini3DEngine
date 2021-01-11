/// <reference path = "../../tsDefinitions/cannon.d.ts" />
import quat from "../../lib/tsm/quat.js";
import vec3 from "../../lib/tsm/vec3.js";

/**
 * physics math types <-> TMS math types
 */
export class MathConverter {
    public static TSMtoCANNONVec3(src: vec3, dest: CANNON.Vec3) {
        dest.set(src.x, src.y, src.z);
    }

    public static CannonToTSMVec3(src: CANNON.Vec3, dest: vec3) {
        // dest.x = src.x; dest.y = src.y; dest.z = src.z;
        dest.setComponents(src.x, src.y, src.z);
    }

    public static CannonToTSMQuat(src: CANNON.Quaternion, dest: quat) {
        dest.setComponents(src.x, src.y, src.z, src.w);
    }
}
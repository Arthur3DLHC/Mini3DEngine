import vec3 from "../../lib/tsm/vec3.js";
import mat4 from "../../lib/tsm/mat4.js";

export class SRTTransform {
    public scale: vec3 = new vec3([1,1,1]);
    /**
     * default rotate order: zxy
     */
    public rotationXYZ: vec3 = new vec3([0,0,0]);
    public translation: vec3 = new vec3([0,0,0]);

    // todo: rotate order?

    public transform: mat4 = mat4.identity.copy();

    public update() {
        
    }
}
import { Behavior, Object3D } from "../../../src/mini3DEngine.js";
import vec3 from "../../../lib/tsm/vec3.js";
import mat4 from "../../../lib/tsm/mat4.js";
import vec4 from "../../../lib/tsm/vec4.js";

export class LookatBehavior extends Behavior {
    public get typeName(): string {
        return "LookatBehavior";
    }
    public constructor(owner: Object3D) {
        super(owner);
        this.position = new vec3();
        this.up = new vec3([0, 1, 0]);
        this.target = new vec3();
    }
    public position: vec3;
    public up: vec3;
    public target: vec3;

    public update() {
        // calculate a view matrix
        // fix me: should calculate local transform matrix to parent world transform.
        const lookat: mat4 = mat4.lookAt(this.position, this.target, this.up);
        this.owner.localTransform = lookat.copyTo();
        this.owner.localTransform.inverse();
        return;
        // invert fast?
        const rot = lookat.copyTo();
        // set owner's world matrix?
        const t = rot.row(3);
        rot.setRow(3, new vec4([0, 0, 0, 1]));
        rot.transpose();
        const trans = mat4.identity.copyTo();
        trans.fromTranslation(new vec3([-t.x, -t.y, -t.z]));
        mat4.product(rot, trans, this.owner.localTransform);
    }
}
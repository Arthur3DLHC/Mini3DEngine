import vec3 from "../../lib/tsm/vec3.js";
import mat4 from "../../lib/tsm/mat4.js";

export class SRTTransform {
    public scaling: vec3 = new vec3([1,1,1]);
    /**
     * default rotate order: zxy
     * in degrees
     */
    public rotationXYZ: vec3 = new vec3([0,0,0]);
    public translation: vec3 = new vec3([0,0,0]);

    // todo: rotate order?

    public transform: mat4 = mat4.identity.copy();

    private static _degreeToRad = Math.PI / 180.0;
    private static _matScale = mat4.identity.copy();
    private static _matRotX = mat4.identity.copy();
    private static _matRotY = mat4.identity.copy();
    private static _matRotZ = mat4.identity.copy();
    private static _matRot = mat4.identity.copy();
    private static _matTran = mat4.identity.copy();

    public update() {
        SRTTransform._matScale.fromScaling(this.scaling);
        SRTTransform._matRotX.fromXRotation(this.scaling.x);
        SRTTransform._matRotY.fromYRotation(this.scaling.y);
        SRTTransform._matRotZ.fromZRotation(this.scaling.z);
        SRTTransform._matTran.fromTranslation(this.translation);

        mat4.product(SRTTransform._matRotX, SRTTransform._matRotZ, SRTTransform._matRot);
        mat4.product(SRTTransform._matRotY, SRTTransform._matRot, SRTTransform._matRot);
        mat4.product(SRTTransform._matRot, SRTTransform._matScale, this.transform);
        mat4.product(SRTTransform._matTran, this.transform, this.transform);
    }
}
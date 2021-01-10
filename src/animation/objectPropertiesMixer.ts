import quat from "../../lib/tsm/quat.js";
import vec3 from "../../lib/tsm/vec3.js";
import { Object3D } from "../scene/object3D.js";

export class PropertyMixer {
    public sumWeight: number = 0;

    public clear() {
        this.sumWeight = 0;
    }
}

export class Vec3PropertyMixer extends PropertyMixer {
    public originalValue: vec3 = new vec3();
    public mixedValue: vec3 = new vec3();

    public clear() {
        super.clear();
        this.mixedValue.setComponents(0, 0, 0);
    }

    public mixAdditive(val: vec3, weight: number) {
        this.mixedValue.x += val.x * weight;
        this.mixedValue.y += val.y * weight;
        this.mixedValue.z += val.z * weight;
    }

    public apply(targetValue: vec3) {
        // mix the result with original value?
        if (this.sumWeight > 0.001) {
            vec3.mix(this.originalValue, this.mixedValue, this.sumWeight, targetValue);
        }
        // if sumWeight near zero, don't touch target value? or copy from origin value?
    }
}

export class QuatPropertyMixer extends PropertyMixer {
    public originalValue: quat = quat.identity.copyTo();
    public mixedValue: quat = quat.identity.copyTo();

    public clear() {
        super.clear();
        this.mixedValue.setComponents(0, 0, 0, 0);
    }

    public mixAdditive(val: quat, weight: number) {
        this.mixedValue.x += val.x * weight;
        this.mixedValue.y += val.y * weight;
        this.mixedValue.z += val.z * weight;
        this.mixedValue.w += val.w * weight;
    }

    public apply(targetValue: quat) {
        // mix the result with original value?
        if (this.sumWeight > 0.001) {
            // quat.mix(this.originalValue, this.mixedValue, this.sumWeight, targetValue);
            // use a simple n-lerp?
            const invWeight = 1.0 - this.sumWeight;
            targetValue.x = this.originalValue.x * invWeight + this.mixedValue.x * this.sumWeight;
            targetValue.y = this.originalValue.y * invWeight + this.mixedValue.y * this.sumWeight;
            targetValue.z = this.originalValue.z * invWeight + this.mixedValue.z * this.sumWeight;
            targetValue.w = this.originalValue.w * invWeight + this.mixedValue.w * this.sumWeight;
        }
    }
}

export class ObjectPropertiesMixer {
    /**
     * note: should call this right after the transform loaded from gltf and before animations start
     * @param target 
     */
    public constructor(target: Object3D) {
        this.target = target;
        target.translation.copyTo(this.translation.originalValue);
        target.rotation.copyTo(this.rotation.originalValue);
        target.scale.copyTo(this.scale.originalValue);
    }

    public target: Object3D;

    public translation: Vec3PropertyMixer = new Vec3PropertyMixer();
    public rotation: QuatPropertyMixer = new QuatPropertyMixer();
    public scale: Vec3PropertyMixer = new Vec3PropertyMixer();

    public reset() {
        this.translation.clear();
        this.rotation.clear();
        this.scale.clear();
    }

    public apply() {
        this.translation.apply(this.target.translation);
        this.rotation.apply(this.target.rotation);
        this.scale.apply(this.target.scale);
    }
}
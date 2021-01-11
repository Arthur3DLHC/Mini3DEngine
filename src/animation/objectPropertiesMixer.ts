import quat from "../../lib/tsm/quat.js";
import vec3 from "../../lib/tsm/vec3.js";
import { Object3D } from "../scene/object3D.js";

export class PropertyMixer {
    public sumWeight: number = 0;

    public clear() {
        this.sumWeight = 0;
    }

    public mixAddtiveArray(val: number[], weight: number) {
        this.sumWeight += weight;
    }

    public mixReplaceArray(val: number[], weight: number) {
        this.sumWeight = weight;
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
        this.sumWeight += weight;
        this.mixedValue.x += val.x * weight;
        this.mixedValue.y += val.y * weight;
        this.mixedValue.z += val.z * weight;
    }

    public mixAddtiveArray(val: number[], weight: number) {
        super.mixAddtiveArray(val, weight);
        this.mixedValue.x += val[0] * weight;
        this.mixedValue.y += val[1] * weight;
        this.mixedValue.z += val[2] * weight;
    }

    public mixReplaceArray(val: number[], weight: number) {
        super.mixReplaceArray(val, weight);
        this.mixedValue.x = val[0] * weight;
        this.mixedValue.y = val[1] * weight;
        this.mixedValue.z = val[2] * weight;
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
        this.sumWeight += weight;
        // todo: check if quaternions are flipped?
        if( quat.dot(this.mixedValue, val) < 0 )
        {
            weight = -weight;
        }
        this.mixedValue.x += val.x * weight;
        this.mixedValue.y += val.y * weight;
        this.mixedValue.z += val.z * weight;
        this.mixedValue.w += val.w * weight;
    }

    public mixAddtiveArray(val: number[], weight: number) {
        super.mixAddtiveArray(val, weight);
        // todo: check if quaternions are flipped?
        let dotresult = 0;
        for (let i = 0; i < 4; i++) {
            dotresult += this.mixedValue.at(i) * val[i];          
        }
        if (dotresult < 0) {
            weight = -weight;
        }

        this.mixedValue.x += val[0] * weight;
        this.mixedValue.y += val[1] * weight;
        this.mixedValue.z += val[2] * weight;
        this.mixedValue.w += val[3] * weight;
    }
    
    public mixReplaceArray(val: number[], weight: number) {
        super.mixReplaceArray(val, weight);
        this.mixedValue.x = val[0] * weight;
        this.mixedValue.y = val[1] * weight;
        this.mixedValue.z = val[2] * weight;
        this.mixedValue.w = val[3] * weight;
    }

    public apply(targetValue: quat) {
        // mix the result with original value?
        if (this.sumWeight > 0.001) {
            // normalize?
            this.mixedValue.normalize();

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
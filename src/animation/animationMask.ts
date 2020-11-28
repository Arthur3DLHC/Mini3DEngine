import { Object3D } from "../scene/object3D.js";

/**
 * joint mask for animation
 */
export class AnimationMask {
    // hold joint pathes?
    /**
     * joint pathes relative to the root node of the character
     */
    // public jointPathes: string[] = [];

    // cache the target joint objects? for performance
    // todo: use a map? to improve performance?
    public joints: Object3D[] = [];

    public contains(joint: Object3D): boolean {
        return this.joints.find((j)=>{j === joint}) !== undefined;
    }

    /**
     * load from json data
     * @param jsonData 
     * @param jointRoot the root joint of the model. all pathes in list will relative to this joint
     */
    public fromJSON(jsonData: any, jointRoot: Object3D) {
        this.joints = [];
        if (jsonData.jointPathes !== undefined) {
            for (const path of jsonData.jointPathes) {
                // this.jointPathes.push(path);
                const joint = jointRoot.getObjectByPath(path);
                if (joint === null) {
                    // json data error
                    throw new Error("joint not found: " + path);
                }
                this.joints.push(joint);
            }
        }
    }
}
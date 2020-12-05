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
        return (this.joints.find((j)=>{return j === joint;}) !== undefined);
    }

    /**
     * load from json data
     * @param jsonData 
     * @param jointRoot the root joint of the model. all pathes in list will relative to this joint
     */
    public fromJSON(jsonData: any, jointRoot: Object3D) {
        this.joints = [];
        if (jsonData.jointPathes !== undefined) {
            for (const jointDef of jsonData.joints) {
                let joint: Object3D | null = null;

                // get by path / search by name
                if (jointDef.path !== undefined) {
                    joint = jointRoot.getObjectByPath(jointDef.path);
                    if (joint === null) {
                        throw new Error("joint not found: " + jointDef.path);
                    }
                } else if (jointDef.name !== undefined) {
                    joint = jointRoot.getChildByName(jointDef.name, true);
                    if (joint === null) {
                        throw new Error("joint not found: " + jointDef.name);
                    }
                }

                if (joint !== null) {
                    this.addJoint(joint, jointDef.recursive);
                }
            }
        }
    }

    public addJoint(joint: Object3D, recursive: boolean) {
        if (this.joints.find((j) => {return j === joint;}) === undefined) {
            this.joints.push(joint);
        }
        if (recursive) {
            for (const child of joint.children) {
                this.addJoint(child, recursive);
            }
        }
    }
}
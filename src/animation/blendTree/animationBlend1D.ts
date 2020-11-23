import { AnimationAction } from "../animationAction.js";
import { AnimationBlendNode } from "./animationBlendNode.js";

export class AnimationBlend1D extends AnimationBlendNode {
    public update(actionParams: Map<string, number>) {
        // there should be 1 and only 1 blendParameter
        if (this.blendParameters.length < 1) {
            return;
        }
        const paramVal = actionParams.get(this.blendParameters[0]);
        if (paramVal === undefined) {
            return;
        }

        // update my actual weight
        this.actualWeight = this.weight * (this.parent === null ? 1.0 : this.parent.actualWeight);

        // calculate children weight according to blendParameters
        if (this.children.length > 0) {
            if (this.children.length < 2) {
                this.children[0].weight = 1;
            } else {
                // find 2 closest children and blend between them
                let maxLeftChild: AnimationBlendNode | null = null;
                let minRightChild: AnimationBlendNode | null = null;
                for (const child of this.children) {
                    if (child.weightParamPositions.length > 0) {
                        // const dist = Math.abs(child.weightParamPositions[0] - paramVal);
                        if (child.weightParamPositions[0] < paramVal) {
                            // is a left child
                            if (maxLeftChild === null || maxLeftChild.weightParamPositions[0] < child.weightParamPositions[0]) {
                                maxLeftChild = child;
                            }
                        } else {
                            // is a right child
                            if(minRightChild === null || minRightChild.weightParamPositions[0] > child.weightParamPositions[0]) {
                                minRightChild = child;
                            }
                        }
                    } else {
                        child.weight = 0;
                        // or throw an error?
                    }
                }
                // todo: calc blend weight of 2 children

            }
        }
        
        // update children
        for (const child of this.children) {
            child.update(actionParams);
        }
    }

    public fromJSON(nodeDef: any, animations: AnimationAction[]) {
        throw new Error("Method not implemented.");
    }
}
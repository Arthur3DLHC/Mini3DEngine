import { AnimationAction } from "../animationAction.js";
import { AnimationBlendNode } from "./animationBlendNode.js";

/**
 * 1D blender
 * can have multiple children; will blend them accroding to their param positions
 */
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
                    child.weight = 0;
                    if (child.weightParamPosition.length > 0) {
                        // const dist = Math.abs(child.weightParamPositions[0] - paramVal);
                        if (child.weightParamPosition[0] < paramVal) {
                            // is a left child
                            if (maxLeftChild === null || maxLeftChild.weightParamPosition[0] < child.weightParamPosition[0]) {
                                maxLeftChild = child;
                            }
                        } else {
                            // is a right child
                            if(minRightChild === null || minRightChild.weightParamPosition[0] > child.weightParamPosition[0]) {
                                minRightChild = child;
                            }
                        }
                    }
                }
                // todo: calc blend weight of 2 children
                // check
                if (maxLeftChild !== null && minRightChild !== null) {
                    const distL = paramVal - maxLeftChild.weightParamPosition[0];
                    const distR = minRightChild.weightParamPosition[0] - paramVal;
                    const distTotal = distL + distR;
                    maxLeftChild.weight = distR / distTotal;    // = 1 - distL / distTotal
                    minRightChild.weight = distL / distTotal;   // = 1 - distR / distTotal
                } else{
                    if (maxLeftChild !== null) {
                        maxLeftChild.weight = 1;    // current value is at right of all children
                    } else if(minRightChild !== null) {
                        minRightChild.weight = 1;   // current value is at left of all children
                    }
                } 
            }
        }
        
        // update children
        for (const child of this.children) {
            child.update(actionParams);
        }
    }
}
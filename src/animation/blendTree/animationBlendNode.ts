import { AnimationAction } from "../animationAction.js";

/**
 * take from unity3d...
 */
export enum BlendMethods {
    Simple1D,
    SimpleDirectional2D,
    FreeformDirectional2D,
    FreeformCartesian2D,
    /**
     * control children weights directly
     */
    Direct,
}

/**
 * base class of animation nodes
 * todo: subclasses: 1D and 2D blending node
 */
export class AnimationBlendNode {
    public constructor() {

    }

    // public blendTree: ActionStateBlendTree | null = null;

    // param name in ActionControlBehavior.actionParams
    // for computing children weights
    // take from unity3d blendtree
    public blendParameters: string[] = [];

    public blendMehtod: BlendMethods = BlendMethods.Simple1D;

    // todo: support layered (partial) animations (blend animation only to some bone and it's children)

    /**
     * the k dimension weight posiiton of this node,
     * in parent blend space
     */
    public weightParamPosition: number[] = [];

    /**
     * weight of this node in parent scope
     */
    public weight: number = 0;
    /**
     * weight of this node in global scope?
     */
    public actualWeight: number = 0;

    /**
     * max 1 animation per leaf node
     */
    public animation: AnimationAction | null = null;

    /**
     * every child has its own weight, and blend position
     */
    public children: AnimationBlendNode[] = [];
    public parent: AnimationBlendNode | null = null;

    public update(actionParams: Map<string, number>) {
        // update my actual weight
        this.actualWeight = this.weight * (this.parent === null ? 1.0 : this.parent.actualWeight);
    
        switch(this.blendMehtod) {
            case BlendMethods.Simple1D:
                this.blendSimple1D(actionParams);
                break;
            case BlendMethods.SimpleDirectional2D:
                this.blendSimpleDirectional2D(actionParams);
                break;
            case BlendMethods.FreeformDirectional2D:
                this.blendFreeformDirectional2D(actionParams);
                break;
            case BlendMethods.FreeformCartesian2D:
                this.blendFreeformCartesian2D(actionParams);
                break;
            case BlendMethods.Direct:
                this.blendDirect(actionParams);
                break;
        }

        // update children
        for (const child of this.children) {
            child.update(actionParams);
        }
    }
    private blendDirect(actionParams: Map<string, number>) {
        // do not need do anything. the weights of children need not to be modified now.
    }
    private blendFreeformCartesian2D(actionParams: Map<string, number>) {
        throw new Error("Method not implemented.");
    }
    private blendFreeformDirectional2D(actionParams: Map<string, number>) {
        throw new Error("Method not implemented.");
    }
    private blendSimpleDirectional2D(actionParams: Map<string, number>) {
        let paramX: number | undefined = 0;
        let paramY: number | undefined = 0;
        if (this.blendParameters.length > 0) {
            paramX = actionParams.get(this.blendParameters[0]);
        }
        if (this.blendParameters.length > 1) {
            paramY = actionParams.get(this.blendParameters[1]);
        }

        if (paramX === undefined || paramY === undefined) {
            throw new Error("param(s) not found: " + this.blendParameters[0] + ", " + this.blendParameters[1]);
        }

        const phi = Math.atan2(paramY, paramX);

        // find nearest 2 children in polar space
        let maxLeftChild: AnimationBlendNode | null = null;
        let minRightChild: AnimationBlendNode | null = null;
        let maxLeftDiff: number = 0;
        let minRightDiff: number = 0;

        let centerChild: AnimationBlendNode | null = null;

        for (const child of this.children) {
            child.weight = 0;

            let sampleX = child.weightParamPosition[0] || 0;
            let sampleY = child.weightParamPosition[1] || 0;

            if (sampleX === 0 && sampleY === 0) {
                // center point, can not calc atan
                centerChild = child;
                continue;
            }

            const radialDiff = this.getRadialDifference(phi, sampleX, sampleY);

            if (minRightChild === null || radialDiff < minRightDiff) {
                minRightChild = child;
                minRightDiff = radialDiff;
            }
            if (maxLeftChild === null || radialDiff > maxLeftDiff) {
                maxLeftChild = child;
                maxLeftDiff = radialDiff;
            }
        }

        // blend between them, use radial difference
        if (maxLeftChild !== null && minRightChild !== null) {
            const distL = Math.PI * 2 - maxLeftDiff;
            const distR = minRightDiff;
            const distTotal = distL + distR;
            maxLeftChild.weight = distR / distTotal; // 1 - distL / distTotal
            minRightChild.weight = distL / distTotal; // 1 - distR / distTotal
        } else {
            if (maxLeftChild !== null) {
                maxLeftChild.weight = 1;
            }
            if (minRightChild !== null) {
                minRightChild.weight = 1;
            }
        }

        // find if there are children in center
        if (centerChild !== null) {
            // blend between 2 children and center
            
        }

        throw new Error("Method not implemented.");
    }

    private getRadialDifference(phi: number, sampleX: number, sampleY: number): number {
        const samplePhi = Math.atan2(sampleY, sampleX);
        let diffPhi = samplePhi - phi;
        // move the result to [0, 2pi];
        diffPhi = diffPhi % (2.0 * Math.PI);
        if (diffPhi < 0) {
            diffPhi += 2.0 * Math.PI;
        }
        return diffPhi;
    }

    private blendSimple1D(actionParams: Map<string, number>) {
        // there should be 1 and only 1 blendParameter
        if (this.blendParameters.length < 1) {
            return;
        }
        const paramVal = actionParams.get(this.blendParameters[0]);
        if (paramVal === undefined) {
            throw new Error("param not found: " + this.blendParameters[0]);
        }
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
                            if (minRightChild === null || minRightChild.weightParamPosition[0] > child.weightParamPosition[0]) {
                                minRightChild = child;
                            }
                        }
                    }
                }
                // calc weights of 2 nearest children
                if (maxLeftChild !== null && minRightChild !== null) {
                    const distL = paramVal - maxLeftChild.weightParamPosition[0];
                    const distR = minRightChild.weightParamPosition[0] - paramVal;
                    const distTotal = distL + distR;
                    maxLeftChild.weight = distR / distTotal;    // = 1 - distL / distTotal
                    minRightChild.weight = distL / distTotal;   // = 1 - distR / distTotal
                } else {
                    if (maxLeftChild !== null) {
                        maxLeftChild.weight = 1;    // current value is at right of all children
                    } else if (minRightChild !== null) {
                        minRightChild.weight = 1;   // current value is at left of all children
                    }
                }
            }
        }
    }

    public fromJSON(nodeDef: any, animations: AnimationAction[]) {
        this.blendParameters = [];
        if (nodeDef.blendParameters !== undefined) {
            for (const paramName of nodeDef.blendParameters) {
                this.blendParameters.push(paramName);
            }
        }
        this.weightParamPosition = [];
        if (nodeDef.weightParamPosition !== undefined) {
            for (const elem of nodeDef.weightParamPosition) {
                this.weightParamPosition.push(elem);
            }
        }
        this.weight = 0;
        this.actualWeight = 0;
        this.animation = null;
        if (nodeDef.animation !== undefined) {
            const animAction = animations.find((action: AnimationAction) => {return action.name === nodeDef.animation});
            if (animAction !== undefined) {
                this.animation = animAction;
            }
        }
        if (nodeDef.blendMethod !== undefined) {
            this.blendMehtod = nodeDef.blendMethod;
        }
        // children
        if (nodeDef.children !== undefined) {
            for (const childDef of nodeDef.children) {
                let child: AnimationBlendNode = new AnimationBlendNode();
                // switch (childDef.nodeType) {
                //     case "1D":
                //         child = new AnimationBlend1D();
                //         break;
                //     case "2D":
                //         child = new AnimationBlend2D();
                //         break;
                //     default:
                //         throw new Error("Unkown blend node type: " + childDef.nodeType)
                //         break;
                // }
                if(child !== null) {
                    child.fromJSON(childDef, animations);
                    child.parent = this;
                    this.children.push(child);
                }
            }
        }
    }
}
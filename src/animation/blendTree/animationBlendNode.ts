import { Clock } from "../../scene/clock.js";
import { AnimationAction } from "../animationAction.js";
import { AnimationApplyMode } from "../animationChannel.js";
import { ActionStateBlendTree } from "../stateMachine/actionStateBlendTree.js";

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

    public constructor(tree: ActionStateBlendTree,
        blendParams?: string[],
        blendMethod?: BlendMethods,
        weightParamPosition?: number[],
        weight?: number,
        animation?: AnimationAction ) {
        this._tree = tree;

        if(blendParams !== undefined) this.blendParameters = blendParams;
        if(blendMethod !== undefined) this.blendMehtod = blendMethod;
        if(weightParamPosition !== undefined) this.weightParamPosition = weightParamPosition;
        if(weight !== undefined) this.weight = weight;
        if(animation !== undefined) this.animation = animation;
    }

    // public blendTree: ActionStateBlendTree | null = null;

    // param name in ActionControlBehavior.actionParams
    // for computing children weights
    // take from unity3d blendtree
    public blendParameters: string[] = [];

    public blendMehtod: BlendMethods = BlendMethods.Simple1D;

    /**
     * the k dimension param posiiton of this node where my weight == 1,
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

    public get tree(): ActionStateBlendTree {return this._tree;}
    private _tree: ActionStateBlendTree;

    public playAnimation() {
        if (this.animation !== null) {
            this.animation.reset();     // sync when start playing
            this.animation.play();
        }
        for (const child of this.children) {
            child.playAnimation();
        }
    }

    public stopAnimation() {
        if (this.animation !== null) {
            this.animation.stop();
        }
        for (const child of this.children) {
            child.stopAnimation();
        }
    }

    public clearAnimationTargetChannelValues() {
        // fix me: how to clear?
        if (this.animation !== null) {
            this.animation.weight = 0;
            this.animation.applyMode = AnimationApplyMode.replace;
            this.animation.update(Clock.instance.curTime, 0);
        }

        for (const child of this.children) {
            child.clearAnimationTargetChannelValues();
        }
    }

    /**
     * upate weights of all nodes
     * @param actionParams current action param values on animation controller
     */
    public updateWeights(actionParams: Map<string, number>) {
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
            child.updateWeights(actionParams);
        }
    }

    public updateAnimations() {
        // if a node's weight is zero, all it's children will not affect the result animation
        if (this.actualWeight < 0.001) {
            return;
        }

        // blend animations with weight
        if (this.animation !== null) {
            // the layer weight has been applied to root node of blend tree
            this.animation.weight = this.actualWeight;
            // the values have been cleared to 0 before
            this.animation.applyMode = AnimationApplyMode.add;
            this.animation.mask = this.tree.machine.animationLayer.mask;
            this.animation.update(Clock.instance.curTime, Clock.instance.elapsedTime);
        }

        for (const child of this.children) {
            child.updateAnimations();
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

        // ref: https://blog.csdn.net/weixin_34111819/article/details/89286796

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

        // todo: use vector operation to find the blend factor
        // let p = vec2(paramX, paramY)
        // p0 = vec2(maxLeftChild.sampleX, maxLeftChild.sampleY)
        // p1 = vec2(minRightChild.sampleX, minRightChild.sampleY)
        // there should be t0, t1 to make:
        // p = t0 * p0 + t1 * p1
        // so   weight0 = t0 / (t0 + t1)
        //      weight1 = t1 / (t0 + t1)
        let t0 = 0.5;
        let t1 = 0.5;
        if (maxLeftChild !== null && minRightChild !== null) {
            const x0 = maxLeftChild.weightParamPosition[0] || 0;
            const y0 = maxLeftChild.weightParamPosition[1] || 0;
    
            const x1 = minRightChild.weightParamPosition[0] || 0;
            const y1 = minRightChild.weightParamPosition[1] || 0;

            // Solving equations
            const denominator = (x1 * y0 - x0 * y1);
            t0 = (x1 * paramY - paramX * y1) / denominator;
            t1 = (paramX - t0 * x0) / x1;                       // 1 less multiplycation
            // t1 = (paramX * y0 - x0 * paramY) / denominator;

            const tsum = t0 + t1;

            maxLeftChild.weight = t0 / tsum;    // not inverse; if t0 = 1, the p is at p0
            minRightChild.weight = t1 / tsum;   // not inverse; if t1 = 1, the p is at p1
        } else {
            if (maxLeftChild !== null) {
                maxLeftChild.weight = 1;
                t0 = 1; t1 = 0;
            }
            if (minRightChild !== null) {
                minRightChild.weight = 1;
                t0 = 0; t1 = 1;
            }
        }
        
        // find if there are children in center
        if (centerChild !== null) {
            // blend between 2 children and center
            centerChild.weight = Math.max(0, Math.min(t0 + t1, 1));
            if (maxLeftChild !== null) {
                maxLeftChild.weight *= 1 - centerChild.weight;
            }
            if (minRightChild !== null) {
                minRightChild.weight *= 1 - centerChild.weight;
            }
        }

        /*
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
        */
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

    public addChild(child: AnimationBlendNode) {
        this.children.push(child);
        child.parent = this;
    }

    public removeChild(child: AnimationBlendNode) {
        const idx = this.children.indexOf(child);
        if (idx >= 0) {
            this.children.splice(idx, 1);
            child.parent = null;
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
            } else {
                throw new Error("Animation not found: " + nodeDef.animation);
            }
        }
        // note: the blendMethod in JSON should be numbers, 0 1 2 ... 
        if (nodeDef.blendMethod !== undefined) {
            this.blendMehtod = nodeDef.blendMethod;
        }
        // children
        if (nodeDef.children !== undefined) {
            for (const childDef of nodeDef.children) {
                let child: AnimationBlendNode = new AnimationBlendNode(this.tree);
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
                //if(child !== null) {
                    child.fromJSON(childDef, animations);
                    child.parent = this;
                    this.children.push(child);
                //}
            }
        }
    }
}
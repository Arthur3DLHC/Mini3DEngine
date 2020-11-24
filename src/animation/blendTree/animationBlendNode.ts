import { AnimationAction } from "../animationAction.js";
import { ActionStateBlendTree } from "../stateMachine/actionStateBlendTree.js";
import { AnimationBlend1D } from "./animationBlend1D.js";
import { AnimationBlend2D } from "./animationBlend2D.js";

/**
 * base class of animation nodes
 * todo: subclasses: 1D and 2D blending node
 * todo: support layered animations (blend animation to some bone and it's children)
 */
export class AnimationBlendNode {
    public constructor() {

    }

    // public blendTree: ActionStateBlendTree | null = null;

    // param name in ActionControlBehavior.actionParams
    // for computing children weights
    // take from unity3d blendtree
    public blendParameters: string[] = [];

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
        // subclasses calculate children weight according to blenderParameters
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
        // children
        if (nodeDef.children !== undefined) {
            for (const childDef of nodeDef.children) {
                let child: AnimationBlendNode | null = null;
                switch (childDef.nodeType) {
                    case "1D":
                        child = new AnimationBlend1D();
                        break;
                    case "2D":
                        child = new AnimationBlend2D();
                        break;
                    default:
                        throw new Error("Unkown blend node type: " + childDef.nodeType)
                        break;
                }
                if(child !== null) {
                    child.fromJSON(childDef, animations);
                    child.parent = this;
                    this.children.push(child);
                }
            }
        }
    }
}
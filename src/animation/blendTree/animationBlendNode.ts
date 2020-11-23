import { AnimationAction } from "../animationAction.js";
import { ActionStateBlendTree } from "../stateMachine/actionStateBlendTree.js";

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

    public weightParamPositions: number[] = [];

    // todo: inputs and weights ?
    /**
     * weight of this node in parent scope
     */
    public weight: number = 1;
    /**
     * weight of this node in global scope?
     */
    public actualWeight: number = 1;

    /**
     * max 1 animation per leaf node
     */
    public animation: AnimationAction | null = null;

    /**
     * every child has its own weight
     */
    public children: AnimationBlendNode[] = [];
    public parent: AnimationBlendNode | null = null;

    public update(actionParams: Map<string, number>) {
        // subclasses calculate children weight according to blenderParameters
    }

    public fromJSON(nodeDef: any, animations: AnimationAction[]) {
        throw new Error("Method not implemented.");
    }
}
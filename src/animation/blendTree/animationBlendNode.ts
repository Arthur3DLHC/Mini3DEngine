import { AnimationAction } from "../animationAction.js";

/**
 * base class of animation nodes
 */
export class AnimationBlendNode {
    public constructor() {

    }

    // param name in ActionControlBehavior.actionParams
    // for computing children weights
    // take from unity3d blendtree
    public blendParameter: string = "";
    public blendParameter1: string = "";

    // todo: inputs and weights ?
    /**
     * weight of this node in parent scope
     */
    public weight: number = 1;
    /**
     * weight of this node in global scope?
     */
    public actualWeight: number = 1;

    public animation: AnimationAction | null = null;

    // every children has its weight
    public children: AnimationBlendNode[] = [];
    public parent: AnimationBlendNode | null = null;

    public update(actionParams: Map<string, number>) {
        // calculate children weight according to blenderParameters
    }

    fromJSON(nodeDef: any, animations: AnimationAction[]) {
        throw new Error("Method not implemented.");
    }
}
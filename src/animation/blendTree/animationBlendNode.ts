/**
 * base class of animation nodes
 */
export class AnimationBlendNode {

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

    // every children has its weight
    public children: AnimationBlendNode[] = [];
    public parent: AnimationBlendNode | null = null;

    public update() {

    }

    fromJSON(nodeDef: any) {
        throw new Error("Method not implemented.");
    }
}
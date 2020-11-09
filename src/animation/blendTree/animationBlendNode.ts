/**
 * base class of animation nodes
 */
export class AnimationBlendNode {
    // todo: inputs and weights ?
    public weight: number = 1;
    public actualWeight: number = 1;

    public children: AnimationBlendNode[] = [];
    public parent: AnimationBlendNode | null = null;

    public update() {

    }
}
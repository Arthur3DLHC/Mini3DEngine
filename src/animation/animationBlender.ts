import { AnimationBlendNode } from "./blendTree/animationBlendNode";

export class AnimationBlender {
    // todo: hold blend tree nodes
    public rootNode: AnimationBlendNode | null = null;
    public update() {
        // todo: update node weights
        // calculate weights for every action (also for channels in animationAction)
        // apply action channels by weight (animationChannel.apply() has a weight parameter)
        // normalize quaternions ?
    }
}
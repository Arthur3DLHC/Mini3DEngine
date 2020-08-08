import { KeyframeTrack } from "./keyframeTrack.js";

/**
 * reusable set of animation data, presenting an animation
 */
export class AnimationClip {
    public name: string = "";
    public tracks: KeyframeTrack[] = [];
}
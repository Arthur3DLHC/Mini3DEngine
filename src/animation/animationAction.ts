import { AnimationClip } from "./animationClip.js";
import { AnimationChannel } from "./animationChannel.js";

/**
 * a live action of animation. hold the clip playing state, cur time...
 */
export class AnimationAction {
    public constructor(clip: AnimationClip, channels: AnimationChannel[]) {
        this._clip = clip;
        this._channels = channels;
    }
    private _clip: AnimationClip;
    private _channels: AnimationChannel[];
}
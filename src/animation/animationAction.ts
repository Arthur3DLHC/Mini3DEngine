import { AnimationClip } from "./animationClip.js";
import { AnimationChannel, AnimationApplyMode } from "./animationChannel.js";

/**
 * a live action of animation. hold the clip playing state, cur time...
 */
export class AnimationAction {
    public constructor(clip: AnimationClip, channels: AnimationChannel[]) {
        this._clip = clip;
        this._channels = channels;
        this._curPlaybackTime = 0;
    }
    private _clip: AnimationClip;
    private _channels: AnimationChannel[];

    private _curPlaybackTime: number;

    public update(time: number, deltaTime: number) {
        // todo: update internal anim time, according to playback speeds and so on
        this._curPlaybackTime += deltaTime;
        for (const channel of this._channels) {
            channel.apply(this._curPlaybackTime, 1.0, AnimationApplyMode.replace);
        }
    }
}
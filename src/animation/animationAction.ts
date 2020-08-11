import { AnimationClip } from "./animationClip.js";
import { AnimationChannel, AnimationApplyMode } from "./animationChannel.js";

export enum AnimationLoopMode {
    Once,
    Repeat,
};

/**
 * a live action of animation. hold the clip playing state, cur time...
 * contains all channels for one animation.
 */
export class AnimationAction {
    public constructor(clip: AnimationClip, channels: AnimationChannel[]) {
        this._clip = clip;
        this._channels = channels;
        this._curPlaybackTime = 0;
        this._speed = 1;
        this._weight = 1;
        this.LoopMode = AnimationLoopMode.Repeat;
    }

    public LoopMode: AnimationLoopMode;

    private _clip: AnimationClip;
    private _channels: AnimationChannel[];

    private _curPlaybackTime: number;
    private _speed: number;

    // todo: anim blend weight
    private _weight: number;

    // todo: functions: play, pause, stop...

    public update(time: number, deltaTime: number) {
        // todo: update internal anim time, according to playback speeds and so on
        this._curPlaybackTime += deltaTime * this._speed;

        // check animation direction (forward or backward)
        // deltaTime should always > 0?
        if (this.LoopMode === AnimationLoopMode.Once) {
            this._curPlaybackTime = Math.max(0, this._curPlaybackTime);
            this._curPlaybackTime = Math.min(this._curPlaybackTime, this._clip.duration);
        } else if (this.LoopMode === AnimationLoopMode.Repeat) {
            if (this._speed > 0) {
                while (this._curPlaybackTime > this._clip.duration) {
                    this._curPlaybackTime -= this._clip.duration;
                }
            } else {
                while (this._curPlaybackTime < 0) {
                    this._curPlaybackTime += this._clip.duration;
                }
            }
        }

        for (const channel of this._channels) {
            channel.apply(this._curPlaybackTime, this._weight, AnimationApplyMode.replace);
        }
    }
}
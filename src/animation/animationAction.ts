import { AnimationClip } from "./animationClip.js";
import { AnimationChannel, AnimationApplyMode } from "./animationChannel.js";
import { Object3D } from "../scene/object3D.js";
import { AnimationMask } from "./animationMask.js";

export enum AnimationLoopMode {
    Repeat,
    Once,
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
        this._applyMode = AnimationApplyMode.replace;
        this._mask = null;
        this._isPlaying = false;
        this.LoopMode = AnimationLoopMode.Repeat;
    }

    public LoopMode: AnimationLoopMode;

    public get name(): string {
        return this._clip.name;
    }

    public get duration(): number {
        return this._clip.duration;
    }

    public get finished(): boolean {
        if (this.LoopMode === AnimationLoopMode.Repeat) {
            return false;
        }
        if (this._speed >= 0) {
            return this._curPlaybackTime >= this._clip.duration;
        } else {
            return this._curPlaybackTime <= 0;
        }
    }

    public get weight(): number {return this._weight;}
    public set weight(w: number) {this._weight = w;}

    public get applyMode(): AnimationApplyMode {return this._applyMode;}
    public set applyMode(mode: AnimationApplyMode) {this._applyMode = mode;}

    public get mask(): AnimationMask | null {return this._mask;}
    public set mask(m: AnimationMask | null) {this._mask = m;}

    /** internal use */
    public get channels(): AnimationChannel[] {return this._channels;}

    private _clip: AnimationClip;
    private _channels: AnimationChannel[];

    private _curPlaybackTime: number;
    private _speed: number;

    // todo: anim blend weight
    private _weight: number;
    private _applyMode: AnimationApplyMode;
    private _mask: AnimationMask | null;

    private _isPlaying: boolean;

    // todo: functions: play, stop, fadein, fadeout...
    public play() {
        this._isPlaying = true;
    }

    public stop() {
        this._isPlaying = false;
    }

    public reset() {
        this._curPlaybackTime = 0;
        this._weight = 1;
    }

    public fadeIn(duration: number) {

    }

    public fadeOut(duration: number) {

    }

    public update(time: number, deltaTime: number) {
        // update internal anim time, according to playback speeds and so on
        if (this._isPlaying) {
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
        }

        // if applyMode is add and my weight is 0, skip all channels for performance
        if (this._applyMode === AnimationApplyMode.add && this._weight < 0.001) {
            return;
        }

        // have mask?
        if (this._mask === null) {
            for (const channel of this._channels) {
                channel.apply(this._curPlaybackTime, this._weight, this._applyMode);
            } 
        } else {
            for (const channel of this._channels) {
                if (this._mask.contains(channel.target)) {
                    channel.apply(this._curPlaybackTime, this._weight, this._applyMode);
                }
            }
        }
    }
}
import { KeyframeTrack } from "./keyframeTrack.js";

/**
 * reusable set of animation data, presenting an animation
 */
export class AnimationClip {
    public constructor(name: string, tracks: KeyframeTrack[]) {
        this.name = name;
        this.tracks = tracks;

        // todo: calc duration
        this._duration = 0;
        for (const track of tracks) {
            for (const time of track.input) {
                this._duration = Math.max(this._duration, time);
            }
        }
    }
    public name: string = "";
    public tracks: KeyframeTrack[] = [];

    public get duration(): number { return this._duration; }

    private _duration: number;
}
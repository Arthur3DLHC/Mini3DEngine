import { KeyframeTrack } from "./keyframeTrack.js";

/**
 * reusable set of animation data, presenting an animation
 */
export class AnimationClip {
    public constructor(name: string, tracks: KeyframeTrack[]) {
        this.name = name;
        this.tracks = tracks;

        // todo: get duration
        this._duration = 0;
    }
    public name: string = "";
    public tracks: KeyframeTrack[] = [];

    public get duration(): number { return this._duration; }

    private _duration: number;
}
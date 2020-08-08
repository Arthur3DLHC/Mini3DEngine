/**
 * animation data
 */
export class KeyframeTrack {
    /** input is keyframe times. length of input and output should be same */
    public input: Float32Array | null = null;
    /** output is keyframe values. length of input and output should be same */
    public output: Float32Array | null = null;
}
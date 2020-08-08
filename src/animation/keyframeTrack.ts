/**
 * animation data
 */
export class KeyframeTrack {
    public constructor(_input: Float32Array, _output: Float32Array) {
        this.input = _input;
        this.output = _output;
    }
    /** input is keyframe times. length of input and output should be same */
    public input: Float32Array;
    /** output is keyframe values. length of input and output should be same */
    public output: Float32Array;
}
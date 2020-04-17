/**
 * alpha blend states
 */
export class BlendState {
    public constructor() {
        this.enable = false;
        this.alphaClip = false;
        this.clipRef = 0.01;
    }
    // alpha blend states
    public enable: boolean;

    public alphaClip: boolean;
    public clipRef: number;
}
export class SSRParams {
    public constructor() {

    }
    public enable: boolean = true;

    public maxRayDistance: number = 4;
    public pixelStride: number = 16;
    public pixelStrideZCutoff: number = 10;
    public screenEdgeFadeStart: number = 0.9;
    public eyeFadeStart: number = 0.4;
    public eyeFadeEnd: number = 0.8;
    public minGlossiness: number = 0.2;
    public zThicknessThreshold: number = 0.1;
    public jitterOffset: number = 0;
}
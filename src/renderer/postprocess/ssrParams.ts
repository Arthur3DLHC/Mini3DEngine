export class SSRParams {
    public constructor() {

    }
    public enable: boolean = true;

    public maxRayDistance: number = 20;
    public pixelStride: number = 32;
    public pixelStrideZCutoff: number = 50;
    public screenEdgeFadeStart: number = 0.9;
    public eyeFadeStart: number = 0.6;
    public eyeFadeEnd: number = 0.8;
    public minGlossiness: number = 0.2;
    public zThicknessThreshold: number = 0.1;
    public jitterOffset: number = 0;

    public blurSize: number = 1;
}
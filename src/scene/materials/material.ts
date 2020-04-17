export class Material {
    public constructor() {
        this.alphaBlend = false;
        this.alphaClip = false;
        this.forceDepthPrepass = false;
    }
    public alphaBlend: boolean;
    public alphaClip: boolean;
    public forceDepthPrepass: boolean;
}
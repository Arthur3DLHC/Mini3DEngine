import { BlendState } from "../../WebGLResources/renderStates/blendState.js";

export class Material {
    public constructor() {
        //this.alphaBlend = false;
        //this.alphaClip = false;
        this.blendState = null;
        this.forceDepthPrepass = false;
    }
    // public alphaBlend: boolean;
    // public alphaClip: boolean;
    public blendState: BlendState|null;
    public forceDepthPrepass: boolean;
}
import { BlendState } from "../../WebGLResources/renderStates/blendState.js";
import { CullState } from "../../WebGLResources/renderStates/cullState.js";
import { DepthStencilState } from "../../WebGLResources/renderStates/depthStencilState.js";

export class Material {
    public constructor() {
        //this.alphaBlend = false;
        //this.alphaClip = false;
        this.blendState = null;
        this.cullState = null;
        this.depthStencilState = null;
        this.forceDepthPrepass = false;
    }
    // public alphaBlend: boolean;
    // public alphaClip: boolean;
    public blendState: BlendState|null;
    public cullState: CullState|null;
    public depthStencilState: DepthStencilState|null;
    // todo: sampler state should bind to textures.
    public forceDepthPrepass: boolean;
}
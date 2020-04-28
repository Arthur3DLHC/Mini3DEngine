import { BlendState } from "../WebGLResources/renderStates/blendState.js";
import { CullState } from "../WebGLResources/renderStates/cullState.js";
import { DepthStencilState } from "../WebGLResources/renderStates/depthStencilState.js";

export class RenderStateSet {
    public constructor() {
        this.blendState = null;
        this.cullState = null;
        this.depthState = null;
    }
    // todo: default render state objects for each render pass
    public blendState: BlendState | null;
    public cullState: CullState | null;
    public depthState: DepthStencilState | null;
}
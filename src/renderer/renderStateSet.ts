import { BlendState } from "../WebGLResources/renderStates/blendState.js";
import { CullState } from "../WebGLResources/renderStates/cullState.js";
import { DepthStencilState } from "../WebGLResources/renderStates/depthStencilState.js";
import { RenderStateCache } from "../WebGLResources/renderStateCache.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { GLRenderStates } from "../WebGLResources/glRenderStates.js";

export class RenderStateSet {
    public constructor() {
        this.blendState = RenderStateCache.instance.getBlendState(false, GLDevice.gl.FUNC_ADD, GLDevice.gl.SRC_ALPHA, GLDevice.gl.ONE_MINUS_SRC_ALPHA);
        this.cullState = RenderStateCache.instance.getCullState(true, GLDevice.gl.BACK);
        this.depthState = RenderStateCache.instance.getDepthStencilState(true, true, GLDevice.gl.LEQUAL);
    }
    // todo: default render state objects for each render pass
    public blendState: BlendState;
    public cullState: CullState;
    public depthState: DepthStencilState;

    public apply() {
        GLRenderStates.setBlendState(this.blendState);
        GLRenderStates.setCullState(this.cullState);
        GLRenderStates.setDepthStencilState(this.depthState);
    }
}
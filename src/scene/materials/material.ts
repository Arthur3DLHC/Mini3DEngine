import { BlendState } from "../../WebGLResources/renderStates/blendState.js";
import { CullState } from "../../WebGLResources/renderStates/cullState.js";
import { DepthStencilState } from "../../WebGLResources/renderStates/depthStencilState.js";
import { UniformBuffer } from "../../WebGLResources/uniformBuffer.js";

export class Material {
    public constructor() {
        this.name = "";
        this.blendState = null;
        this.cullState = null;
        this.depthStencilState = null;
        this.forceDepthPrepass = false;

        // fix me: 材质的 ubo，用动态还是用静态？
        this._uniformBuffer = new UniformBuffer();
    }
    public name: string;
    public blendState: BlendState|null;
    public cullState: CullState|null;
    public depthStencilState: DepthStencilState|null;
    // todo: sampler state should bind to textures.
    public forceDepthPrepass: boolean;

    protected _uniformBuffer: UniformBuffer;

    public destroy() {
        this._uniformBuffer.release();
    }
}
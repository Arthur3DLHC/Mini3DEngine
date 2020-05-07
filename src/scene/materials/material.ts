import { BlendState } from "../../WebGLResources/renderStates/blendState.js";
import { CullState } from "../../WebGLResources/renderStates/cullState.js";
import { DepthStencilState } from "../../WebGLResources/renderStates/depthStencilState.js";
import { UniformBuffer } from "../../WebGLResources/uniformBuffer.js";
import { RenderStateCache } from "../../WebGLResources/renderStateCache.js";
import { GLDevice } from "../../WebGLResources/glDevice.js";

export class Material {
    public constructor() {
        this.name = "";
        this.blendState = RenderStateCache.instance.getBlendState(false, GLDevice.gl.FUNC_ADD, GLDevice.gl.SRC_ALPHA, GLDevice.gl.ONE_MINUS_SRC_ALPHA);
        this.cullState = RenderStateCache.instance.getCullState(true, GLDevice.gl.CCW);
        this.depthStencilState = RenderStateCache.instance.getDepthStencilState(true, true, GLDevice.gl.LEQUAL);
        this.forceDepthPrepass = false;

        // fix me: 材质的 ubo，用动态还是用静态？
        // A: 是所有材质共用同一个动态 ubo，在每次绘制时将参数拷贝进去，
        // B: 还是每个材质实例创建一个静态 ubo，在每次绘制时绑定？
        // 似乎 Babylon.js 中使用的是 B 方案；在切换材质前判断一下是否和现有的材质是同一个材质；
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
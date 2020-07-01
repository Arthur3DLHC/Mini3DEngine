import { BlendState } from "./renderStates/blendState.js";
import { CullState } from "./renderStates/cullState.js";
import { DepthStencilState } from "./renderStates/depthStencilState.js";
import { SamplerState } from "./renderStates/samplerState.js";
import { ColorWriteState } from "./renderStates/colorWriteState.js";
import { GLDevice } from "./glDevice.js";

export class RenderStateCache {
    private static _instance: RenderStateCache|null = null;
    private blendStates: BlendState[];
    private cullStates: CullState[];
    private depthStates: DepthStencilState[];
    private colorWriteStates: ColorWriteState[];
    // sampler state 是绑定到每个纹理上的，不在这里缓存？
    // private samplerStates: SamplerState[];

    private constructor() {
        this.blendStates = [];
        this.cullStates = [];
        this.depthStates = [];
        this.colorWriteStates = [];
        // this.samplerStates = [];
    }

    public static get instance(): RenderStateCache {
        if (!this._instance) {
            this._instance = new RenderStateCache();
        }
        return this._instance;
    }

    public getBlendState(enable: boolean = false, equation: GLenum = GLDevice.gl.FUNC_ADD, srcFactor: GLenum = GLDevice.gl.SRC_ALPHA, destFactor: GLenum = GLDevice.gl.ONE_MINUS_SRC_ALPHA): BlendState {
        for (const bs of this.blendStates) {
            if (bs.equals(enable, equation, srcFactor, destFactor)) {
                return bs;
            }
        }
        const newState = new BlendState(enable, equation, srcFactor, destFactor);
        this.blendStates.push(newState);
        return newState;
    }

    public getCullState(enable: boolean = true, mode: GLenum = GLDevice.gl.BACK): CullState {
        for (const cs of this.cullStates) {
            if (cs.equals(enable, mode)) {
                return cs;
            }
        }
        const newState = new CullState(enable, mode);
        this.cullStates.push(newState);
        return newState;
    }

    public getDepthStencilState(enable: boolean = true, write: boolean = true, func: GLenum = GLDevice.gl.LEQUAL): DepthStencilState {
        for (const ds of this.depthStates) {
            if (ds.equals(enable, write, func)) {
                return ds;
            }
        }
        const newState = new DepthStencilState(enable, write, func);
        this.depthStates.push(newState);
        return newState;
    }

    public getColorWriteState(red: boolean = true, green: boolean = true, blue: boolean = true, alpha: boolean = true) {
        for (const cs of this.colorWriteStates) {
            if (cs.equals(red, green, blue, alpha)) {
                return cs;
            }
        }
        const newState = new ColorWriteState(red, green, blue, alpha);
        this.colorWriteStates.push(newState);
        return newState;
    }
}
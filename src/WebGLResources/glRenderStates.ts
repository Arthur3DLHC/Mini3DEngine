import { BlendState } from "./renderStates/blendState.js";
import { CullState } from "./renderStates/cullState.js";
import { DepthStencilState } from "./renderStates/depthStencilState.js";
import { ColorWriteState } from "./renderStates/colorWriteState.js";

export class GLRenderStates {

    private static _curBlendState: BlendState | null = null;
    private static _curCullState: CullState | null = null;
    private static _curDepthStencilState: DepthStencilState | null = null;
    private static _curColorWriteState: ColorWriteState | null = null;
    // todo: sampler states for every texture stage?

    public static setBlendState(state:BlendState) {
        if (this._curBlendState !== state) {
            this._curBlendState = state;
            this._curBlendState.apply();
        }
    }

    public static setCullState(state:CullState) {
        if (this._curCullState !== state) {
            this._curCullState = state;
            this._curCullState.apply();
        }
    }

    public static setDepthStencilState(state: DepthStencilState) {
        if (this._curDepthStencilState !== state) {
            this._curDepthStencilState = state;
            this._curDepthStencilState.apply();
        }
    }

    public static setColorWriteState(state: ColorWriteState) {
        if (this._curColorWriteState !== state) {
            this._curColorWriteState = state;
            this._curColorWriteState.apply();
        }
    }
}
import { BlendState } from "./renderStates/blendState.js";
import { CullState } from "./renderStates/cullState.js";
import { DepthStencilState } from "./renderStates/depthStencilState.js";

export class GLDevice {
    public static gl: WebGL2RenderingContext;
    public static init(canvas: HTMLCanvasElement) {
        // initialize WebGL 2.0
        const gl2 = canvas.getContext('webgl2', {antialias: false});
        if (gl2) {
            this.gl = gl2;
        } else {
            // no fall back render pipeline yet
            throw new Error("WebGL 2 is not available");
        }
    }

    private static curBlendState: BlendState | null = null;
    private static curCullState: CullState | null = null;
    private static curDepthStencilState: DepthStencilState | null = null;
    // todo: sampler states for every texture stage?

    public static setBlendState(state:BlendState) {
        if (this.curBlendState !== state) {
            this.curBlendState = state;
            this.curBlendState.apply();
        }
    }

    public static setCullState(state:CullState) {
        if (this.curCullState !== state) {
            this.curCullState = state;
            this.curCullState.apply();
        }
    }

    public static setDepthStencilState(state: DepthStencilState) {
        if (this.curDepthStencilState !== state) {
            this.curDepthStencilState = state;
            this.curDepthStencilState.apply();
        }
    }
}
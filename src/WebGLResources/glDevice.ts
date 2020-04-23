import { BlendState } from "./renderStates/blendState.js";
import { CullState } from "./renderStates/cullState.js";
import { DepthStencilState } from "./renderStates/depthStencilState.js";
import { FrameBuffer } from "./frameBuffer.js";

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

    private static _renderTarget: FrameBuffer | null;    
    
    /**
     * set current render target
     * @param renderTarget null for render to window
     */
    public static setRenderTarget(renderTarget: FrameBuffer | null) {
        // if gl fbo not created, create it
        if (renderTarget) {
            renderTarget.prepare();
            GLDevice.gl.bindFramebuffer(GLDevice.gl.FRAMEBUFFER, renderTarget.glFrameBuffer);
        } else {
            GLDevice.gl.bindFramebuffer(GLDevice.gl.FRAMEBUFFER, null);
        }
        this._renderTarget = renderTarget;
    }
}
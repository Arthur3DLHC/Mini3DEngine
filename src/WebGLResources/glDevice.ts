import { FrameBuffer } from "./frameBuffer.js";
import { GLGeometryBuffers } from "./glGeometryBuffers.js";
import vec4 from "../../lib/tsm/vec4.js";

export class GLDevice {
    public static gl: WebGL2RenderingContext;
    public static initialize(canvas: HTMLCanvasElement) {
        // initialize WebGL 2.0
        const gl2 = canvas.getContext('webgl2', {antialias: false});
        if (gl2) {
            this.gl = gl2;
        } else {
            // no fall back render pipeline yet
            throw new Error("WebGL 2 is not available");
        }
        this._canvas = canvas;

        const maxUBSize = GLDevice.gl.getParameter(GLDevice.gl.MAX_UNIFORM_BLOCK_SIZE);
        console.log("max uniform block size: " + maxUBSize);

        // todo: 在这里初始化所有 gl 相关模块？
        GLGeometryBuffers.initialize();
    }

    private static _canvas: HTMLCanvasElement;
    private static _renderTarget: FrameBuffer | null;
    private static _clearColor: vec4 = new vec4([0,0,1,1]);
    private static _clearDepth: number = 1;
    private static _clearStencil: number = 1;
    
    public static get canvas(): HTMLCanvasElement {
        return GLDevice._canvas;
    }
    
    /**
     * set current render target
     * @param renderTarget null for render to window
     */
    public static set renderTarget(renderTarget: FrameBuffer | null) {
        // set only when changed
        if (this._renderTarget !== renderTarget) {
            // if gl fbo not created, create it
            if (renderTarget) {
                renderTarget.prepare();
                GLDevice.gl.bindFramebuffer(GLDevice.gl.DRAW_FRAMEBUFFER, renderTarget.glFrameBuffer);
            } else {
                GLDevice.gl.bindFramebuffer(GLDevice.gl.DRAW_FRAMEBUFFER, null);
            }
            this._renderTarget = renderTarget;            
        }
    }

    public static get renderTarget(): FrameBuffer | null {
        return GLDevice._renderTarget;
    }

    public static set clearColor(color: vec4) {
        GLDevice._clearColor = color;
        GLDevice.gl.clearColor(color.r, color.g, color.b, color.a);
    }
    public static get clearColor(): vec4 {
        return GLDevice._clearColor;
    }
    public static set clearDepth(depth: number) {
        GLDevice._clearDepth = depth;
        GLDevice.gl.clearDepth(depth);
    }
    public static get clearDepth(): number {
        return GLDevice._clearDepth;
    }
    public static set clearStencil(stencil: number) {
        GLDevice._clearStencil = stencil;
        GLDevice.gl.clearStencil(stencil);
    }
    public static get clearStencil(): number {
        return GLDevice._clearStencil;
    }
    public static clear(color: boolean, depth: boolean, stencil: boolean) {
        let mode: GLenum = 0;
        if (color) {
            mode |= GLDevice.gl.COLOR_BUFFER_BIT;
        }
        if (depth) {
            mode |= GLDevice.gl.DEPTH_BUFFER_BIT;
        }
        if (stencil) {
            mode |= GLDevice.gl.STENCIL_BUFFER_BIT;
        }
        if (mode !== 0) {
            this.gl.clear(mode);
        }
    }
}
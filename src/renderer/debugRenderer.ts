// shader codes
import fullscreen_rect_vs from "./shaders/fullscreen_rect_vs.glsl.js";
import debug_cluster_fs from "./shaders/debug_cluster_fs.glsl.js";

// objects
import { ClusteredForwardRenderContext } from "./clusteredForwardRenderContext.js";
import { GLPrograms } from "../WebGLResources/glPrograms.js";
import { ShaderProgram } from "../WebGLResources/shaderProgram.js";
import { RenderStateSet } from "./renderStateSet.js";
import { RenderStateCache } from "../WebGLResources/renderStateCache.js";
import { PlaneGeometry } from "../geometry/common/planeGeometry.js";

/**
 * render debug infos
 */
export class DebugRenderer {
    public constructor(context: ClusteredForwardRenderContext) {
        if (GLPrograms.shaderCodes["fullscreen_rect_vs"] === undefined) {
            GLPrograms.shaderCodes["fullscreen_rect_vs"] = fullscreen_rect_vs;
        }
        if (GLPrograms.shaderCodes["debug_cluster_fs"] === undefined) {
            GLPrograms.shaderCodes["debug_cluster_fs"] = debug_cluster_fs;
        }

        // create shaders
        this._debugClusterProgram = new ShaderProgram();
        this._debugClusterProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._debugClusterProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["debug_cluster_fs"]);
        this._debugClusterProgram.build();

        // bind uniform blocks
        context.bindUniformBlocks(this._debugClusterProgram);
    
        this._debugClusterRenderStates = new RenderStateSet();
        this._debugClusterRenderStates.blendState = RenderStateCache.instance.getBlendState(true);
        this._debugClusterRenderStates.colorWriteState = RenderStateCache.instance.getColorWriteState();
        this._debugClusterRenderStates.cullState = RenderStateCache.instance.getCullState(false);
        this._debugClusterRenderStates.depthState = RenderStateCache.instance.getDepthStencilState(false, false);
        
        this._rectGeom = new PlaneGeometry(2, 2, 1, 1);
    }

    public release() {
        if (this._debugClusterProgram) {
            this._debugClusterProgram.release();
        }
        if (this._rectGeom) {
            this._rectGeom.destroy();
        }
    }

    private _debugClusterProgram : ShaderProgram;
    private _debugClusterRenderStates : RenderStateSet;
    private _rectGeom : PlaneGeometry;
}
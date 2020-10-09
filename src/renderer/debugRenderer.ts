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
import { Texture2D } from "../WebGLResources/textures/texture2D.js";
import { FrameBuffer } from "../WebGLResources/frameBuffer.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { GLTextures } from "../WebGLResources/glTextures.js";

/**
 * render debug infos
 */
export class DebugRenderer {
    private _debugClusterProgram : ShaderProgram;
    private _debugClusterRenderStates : RenderStateSet;
    private _rectGeom : PlaneGeometry;
    private _sceneDepthTexture: Texture2D;
    private _sceneDepthTexUnit: number = 0;

    // todo: public flags for render different debug infos
    public showClusters: boolean = true;
    public clusterDrawMode: number = 0;

    public constructor(context: ClusteredForwardRenderContext, sceneDepthTex: Texture2D) {
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

        this._sceneDepthTexture = sceneDepthTex;
    }

    public render(startTexUnit: number, target: FrameBuffer) {
        this._sceneDepthTexUnit = startTexUnit + 1;

        GLDevice.renderTarget = target;
        const gl = GLDevice.gl;
        gl.viewport(0, 0, this._sceneDepthTexture.width, this._sceneDepthTexture.height);
        gl.scissor(0, 0, this._sceneDepthTexture.width, this._sceneDepthTexture.height);

        if (this.showClusters) {
            this.drawClusters(gl);
        }

        GLTextures.setTextureAt(this._sceneDepthTexUnit, null);
    }

    public release() {
        if (this._debugClusterProgram) {
            this._debugClusterProgram.release();
        }
        if (this._rectGeom) {
            this._rectGeom.destroy();
        }
    }

    private drawClusters(gl: WebGL2RenderingContext) {
        GLTextures.setTextureAt(this._sceneDepthTexUnit, this._sceneDepthTexture);

        // render states
        this._debugClusterRenderStates.apply();

        // use program
        GLPrograms.useProgram(this._debugClusterProgram);

        // uniforms
        gl.uniform1i(this._debugClusterProgram.getUniformLocation("s_sceneDepth"), this._sceneDepthTexUnit);
        gl.uniform1i(this._debugClusterProgram.getUniformLocation("u_debugDrawMode"), this.clusterDrawMode);

        // draw fullscreen quad
        this._rectGeom.draw(0, Infinity, this._debugClusterProgram.attributes);
    }
}
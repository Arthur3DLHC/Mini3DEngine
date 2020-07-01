import fullscreen_rect_vs from "./shaders/fullscreen_rect_vs.glsl.js";
import subsurface_pre_integrate_fs from "./shaders/subsurface_pre_integrate_fs.glsl.js";

import { Texture2D } from "../WebGLResources/textures/texture2D.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { FrameBuffer } from "../WebGLResources/frameBuffer.js";
import { ShaderProgram } from "../WebGLResources/shaderProgram.js";
import { GLPrograms } from "../WebGLResources/glPrograms.js";
import { PlaneGeometry } from "../geometry/common/planeGeometry.js";
import { RenderStateSet } from "./renderStateSet.js";
import { RenderStateCache } from "../WebGLResources/renderStateCache.js";

/**
 * processor for subsurface scattering
 */
export class SubsurfaceProcessor {
    public constructor(){
        const gl = GLDevice.gl;
        // todo: import subsurface pre-integrating shader code string
        // todo: build shader program
        if (GLPrograms.shaderCodes["fullscreen_rect_vs"] === undefined) {
            GLPrograms.shaderCodes["fullscreen_rect_vs"] = fullscreen_rect_vs;
        }

        const integrateProgram = new ShaderProgram();
        integrateProgram.name = "subsurfIntegrate";
        integrateProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        integrateProgram.fragmentShaderCode = GLPrograms.processSourceCode(subsurface_pre_integrate_fs);
        integrateProgram.build();

        // do not need to bind uniform blocks?

        // todo: plane geometry
        const planeGeom = new PlaneGeometry(2, 2, 1, 1);

        // todo: bake pre-integrated BRDF texture
        // two channels: 
        // R: blurred NdotL
        // G: subsurface color intensity
        this.preIntegratedBRDFTexture = new Texture2D(256, 256, 1, 1, GLDevice.gl.RG, GLDevice.gl.HALF_FLOAT, false);
        this.preIntegratedBRDFTexture.create();

        // create a temp FBO, bind brdf texture
        const tmpFBO = new FrameBuffer();
        tmpFBO.setTexture(0, this.preIntegratedBRDFTexture);
        tmpFBO.prepare();

        // set as rendertarget; set viewport and scissor
        GLDevice.renderTarget = tmpFBO;
        gl.viewport(0, 0, this.preIntegratedBRDFTexture.width, this.preIntegratedBRDFTexture.height);
        gl.scissor(0, 0, this.preIntegratedBRDFTexture.width, this.preIntegratedBRDFTexture.height);

        // todo: render state
        const renderStates = new RenderStateSet();
        renderStates.blendState = RenderStateCache.instance.getBlendState(false);
        renderStates.colorWriteState = RenderStateCache.instance.getColorWriteState(true, true, true, true);
        renderStates.cullState = RenderStateCache.instance.getCullState(false);
        renderStates.depthState = RenderStateCache.instance.getDepthStencilState(false, false);

        renderStates.apply();

        // use shader
        GLPrograms.useProgram(integrateProgram);

        // render a fullscreen quad
        planeGeom.draw(0, Infinity, integrateProgram.attributes);
        
        // cleanup: release FBO, geometry and shader
        tmpFBO.release();
        integrateProgram.release();
        planeGeom.destroy();
    }

    // pre-integrated BRDF texture
    public preIntegratedBRDFTexture: Texture2D;
}
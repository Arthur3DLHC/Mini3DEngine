import samplers_postprocess from "./shaders/shaderIncludes/samplers_postprocess.glsl.js";
import fullscreen_rect_vs from "./shaders/fullscreen_rect_vs.glsl.js";
import postprocess_ssao_fs from "./shaders/postprocess_ssao_fs.glsl.js";
import postprocess_ssao_blur_fs from "./shaders/postprocess_ssao_blur_fs.glsl.js";
import postprocess_ssr_fs from "./shaders/postprocess_ssr_fs.glsl.js";
import postprocess_composite_fs from "./shaders/postprocess_composite_fs.glsl.js";
import postprocess_tonemapping_fs from "./shaders/postprocess_tonemapping_fs.glsl.js";

import { Texture2D } from "../WebGLResources/textures/texture2D.js";
import { FrameBuffer } from "../WebGLResources/frameBuffer.js";
import { GLPrograms } from "../WebGLResources/glPrograms.js";
import { ShaderProgram } from "../WebGLResources/shaderProgram.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { SamplerState } from "../WebGLResources/renderStates/samplerState.js";
import { RenderStateSet } from "./renderStateSet.js";
import { PlaneGeometry } from "../geometry/common/planeGeometry.js";
import { RenderStateCache } from "../WebGLResources/renderStateCache.js";
import { GLTextures } from "../WebGLResources/glTextures.js";
import { SamplerUniforms } from "../WebGLResources/samplerUniforms.js";
import vec3 from "../../lib/tsm/vec3.js";
import { Halton } from "../math/halton.js";
import { SSAOParams } from "./postprocess/ssaoParams.js";
import { Texture } from "../WebGLResources/textures/texture.js";
import { BlendState } from "../WebGLResources/renderStates/blendState.js";
import { GLRenderStates } from "../WebGLResources/glRenderStates.js";
import { GLUniformBuffers } from "../WebGLResources/glUnifomBuffers.js";
import { ClusteredForwardRenderContext } from "./clusteredForwardRenderContext.js";
import { SSRParams } from "./postprocess/ssrParams.js";

/**
 * all post processes supported
 */
export class PostProcessor {

    public constructor(context: ClusteredForwardRenderContext, sceneDepthTex: Texture2D, sceneNormalTex: Texture2D, specRoughTex: Texture2D) {
        // register shader codes
        if (GLPrograms.shaderCodes["fullscreen_rect_vs"] === undefined) {
            GLPrograms.shaderCodes["fullscreen_rect_vs"] = fullscreen_rect_vs;
        }
        if (GLPrograms.shaderCodes["postprocess_ssao_fs"] === undefined) {
            GLPrograms.shaderCodes["postprocess_ssao_fs"] = postprocess_ssao_fs;
        }
        if (GLPrograms.shaderCodes["postprocess_ssao_blur_fs"] === undefined) {
            GLPrograms.shaderCodes["postprocess_ssao_blur_fs"] = postprocess_ssao_blur_fs;
        }
        if (GLPrograms.shaderCodes["postprocess_ssr_fs"] === undefined) {
            GLPrograms.shaderCodes["postprocess_ssr_fs"] = postprocess_ssr_fs;
        }
        if (GLPrograms.shaderCodes["postprocess_composite_fs"] === undefined) {
            GLPrograms.shaderCodes["postprocess_composite_fs"] = postprocess_composite_fs;
        }
        if (GLPrograms.shaderCodes["postprocess_tonemapping_fs"] === undefined) {
            GLPrograms.shaderCodes["postprocess_tonemapping_fs"] = postprocess_tonemapping_fs;
        }

        if (GLPrograms.shaderCodes["samplers_postprocess"] === undefined) {
            GLPrograms.shaderCodes["samplers_postprocess"] = samplers_postprocess;
        }

        // create shaders
        this._ssaoProgram = new ShaderProgram();
        this._ssaoProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._ssaoProgram.fragmentShaderCode = GLPrograms.processSourceCode(
            "#define NUM_KERNELS " + SSAOParams.numKernels + "\n"
            + GLPrograms.shaderCodes["postprocess_ssao_fs"]);
        this._ssaoProgram.build();

        this._ssaoBlurProgram = new ShaderProgram();
        this._ssaoBlurProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._ssaoBlurProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["postprocess_ssao_blur_fs"]);
        this._ssaoBlurProgram.build();

        this._ssrProgram = new ShaderProgram();
        this._ssrProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._ssrProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["postprocess_ssr_fs"]);
        this._ssrProgram.build();

        this._compositeProgram = new ShaderProgram();
        this._compositeProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._compositeProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["postprocess_composite_fs"]);
        this._compositeProgram.build();

        this._toneMappingProgram = new ShaderProgram();
        this._toneMappingProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._toneMappingProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["postprocess_tonemapping_fs"]);
        this._toneMappingProgram.build();

        // don't foget to bind the uniform blocks used.
        //GLUniformBuffers.bindUniformBlock(this._ssaoProgram, "View");
        //GLUniformBuffers.bindUniformBlock(this._ssaoBlurProgram, "View");

        context.bindUniformBlocks(this._ssaoProgram);
        context.bindUniformBlocks(this._ssaoBlurProgram);
        context.bindUniformBlocks(this._toneMappingProgram);

        // this._samplerUniformsSSAO = new SamplerUniforms(this._ssaoProgram);
        // this._samplerUniformsSSAOComposite = new SamplerUniforms(this._compositeSSAOProgram);
        
        // this._postProcessFBO = new FrameBuffer();
        // this._postProcessFBO.setTexture(0, sceneColorTex);
        // no depth stencil needed
        // this._postProcessFBO.prepare();
        this._postProcessFBO = null;
        this._prevFrame = null;

        this._sceneNormalTexture = sceneNormalTex;
        this._sceneDepthTexture = sceneDepthTex;
        this._sceneSpecRoughTexture = specRoughTex;

        // create temp textures and framebuffers
        this._ssaoTexture = new Texture2D(sceneDepthTex.width / 2, sceneDepthTex.height / 2, 1, 1, GLDevice.gl.RGBA, GLDevice.gl.HALF_FLOAT);
        this._ssaoTexture.samplerState = new SamplerState(GLDevice.gl.CLAMP_TO_EDGE, GLDevice.gl.CLAMP_TO_EDGE);
        this._ssaoTexture.create();

        this._ssaoFBO = new FrameBuffer();
        this._ssaoFBO.setTexture(0, this._ssaoTexture);
        this._ssaoFBO.prepare();

        this._ssrTexture = new Texture2D(sceneDepthTex.width / 2, sceneDepthTex.height / 2, 1, 1, GLDevice.gl.RGBA, GLDevice.gl.HALF_FLOAT);
        this._ssrTexture.samplerState = new SamplerState(GLDevice.gl.CLAMP_TO_EDGE, GLDevice.gl.CLAMP_TO_EDGE);
        this._ssrTexture.create();

        this._ssrFBO = new FrameBuffer();
        this._ssrFBO.setTexture(0, this._ssrTexture);
        this._ssrFBO.prepare();

        // this._tempFullSwapFBO = [];

        // for(let i = 0; i < 2; i++)
        // {
        //     const swapFBO = new FrameBuffer();

        //     const swapTexture = new Texture2D();
        //     swapTexture.width = width;
        //     swapTexture.height = height;
        //     swapTexture.depth = 1;
        //     swapTexture.mipLevels = 1;
        //     swapTexture.format = GLDevice.gl.RGBA;
        //     swapTexture.componentType = GLDevice.gl.HALF_FLOAT;
        //     swapTexture.samplerState = new SamplerState(GLDevice.gl.CLAMP_TO_EDGE, GLDevice.gl.CLAMP_TO_EDGE);
        //     swapTexture.create();

        //     swapFBO.setTexture(0, swapTexture);
        //     swapFBO.prepare();
    
        //     this._tempFullSwapFBO.push(swapFBO);
        // }

        // this._curOutputFBOIdx = 0;

        this._renderStates = new RenderStateSet();
        this._renderStates.blendState = RenderStateCache.instance.getBlendState(false, GLDevice.gl.FUNC_ADD, GLDevice.gl.SRC_ALPHA, GLDevice.gl.ONE_MINUS_SRC_ALPHA);
        this._renderStates.colorWriteState = RenderStateCache.instance.getColorWriteState(true, true, true, true);
        this._renderStates.cullState = RenderStateCache.instance.getCullState(false, GLDevice.gl.BACK);
        this._renderStates.depthState = RenderStateCache.instance.getDepthStencilState(false, false, GLDevice.gl.ALWAYS);

        this._ssaoBlurBlendState = RenderStateCache.instance.getBlendState(true, GLDevice.gl.FUNC_ADD, GLDevice.gl.DST_COLOR, GLDevice.gl.ZERO);

        this._rectGeom = new PlaneGeometry(2, 2, 1, 1);

        this.ssao = new SSAOParams();
        this.ssr = new SSRParams();
    }

    public release() {
        if (this._ssaoProgram) { this._ssaoProgram.release(); }
        if (this._ssaoBlurProgram) { this._ssaoBlurProgram.release(); }
        if (this._ssrProgram) { this._ssrProgram.release(); }
        if (this._compositeProgram) { this._compositeProgram.release(); }
        if (this._ssaoFBO) { this._ssaoFBO.release(); }
        if (this._ssaoTexture) { this._ssaoTexture.release(); }
        if (this._ssrFBO) { this._ssrFBO.release(); }
        if (this._ssrTexture) { this._ssrTexture.release(); }
        if (this._rectGeom) { this._rectGeom.destroy(); }
    }

    public enableSSR: boolean = true;
    public enableFXAA: boolean = true;
    public enableGlow: boolean = true;
    public enableToneMapping: boolean = true;
    // todo: other post processing effects: color grading, glow...

    public ssao: SSAOParams;
    public ssr: SSRParams;

    // todo: shaders

    private _ssaoProgram: ShaderProgram;
    private _ssaoBlurProgram: ShaderProgram;
    private _ssrProgram: ShaderProgram;
    private _compositeProgram: ShaderProgram;
    private _toneMappingProgram: ShaderProgram;
    // private _samplerUniformsSSAO: SamplerUniforms;
    // private _samplerUniformsSSAOComposite: SamplerUniforms;

    private _postProcessFBO: FrameBuffer | null;         // only contains scene color texture
    private _prevFrame: Texture2D | null;

    /**
     * half resolution ssao result image
     */
    private _ssaoTexture: Texture2D;
    private _ssaoFBO: FrameBuffer;

    /**
     * half resolution ssr result image
     */
    private _ssrTexture: Texture2D;
    private _ssrFBO: FrameBuffer;

    // todo: last frame image
    // 使用两个交替的 framebuffer，还是每帧最后拷贝一下？
    // 交替的开销更小一些？由 renderer 维护，负责每帧交替地传进来？

    private _renderStates: RenderStateSet;
    private _ssaoBlurBlendState: BlendState;

    private _rectGeom: PlaneGeometry;

    // common texture units
    private _sceneDepthTexture: Texture2D;
    private _sceneNormalTexture: Texture2D;
    private _sceneSpecRoughTexture: Texture2D;

    private _sceneColorTexUnit: number = 0;
    private _sceneDepthTexUnit: number = 0;
    private _sceneNormalTexUnit: number = 0;
    private _sceneSpecRoughTexUnit: number = 0;

    // start unit for custom textures of every effects
    private _customTexStartUnit: number = 0;

    public processOpaque(startTexUnit: number, target: FrameBuffer, prevFrame: Texture2D) {
        // todo: bind general texturess for once
        this._sceneColorTexUnit = startTexUnit;
        this._sceneDepthTexUnit = startTexUnit + 1;
        this._sceneNormalTexUnit = startTexUnit + 2;
        this._sceneSpecRoughTexUnit = startTexUnit + 3;
        this._customTexStartUnit = startTexUnit + 4;

        this._postProcessFBO = target;
        this._prevFrame = prevFrame;

        GLDevice.renderTarget = target;

        // set these textures for all effects
        GLTextures.setTextureAt(this._sceneDepthTexUnit, this._sceneDepthTexture);
        GLTextures.setTextureAt(this._sceneNormalTexUnit, this._sceneNormalTexture);
        GLTextures.setTextureAt(this._sceneSpecRoughTexUnit, this._sceneSpecRoughTexture);

        // todo: apply all enabled processes together
        // fix me: 应该分别在不同的阶段分开应用不同的后期特效
        // SSAO: 不透明之后，半透明之前
        // SSR: 也是不透明之后，半透明之前？

        if (this.ssao.enable) {
            this.applySSAO();
        }

        if (this.ssr.enable) {
            this.generateSSR();
        }

        this.composite();

        // unbind textrues to allow them use as rendertarget next frame
        GLTextures.setTextureAt(this._sceneDepthTexUnit, null);
        GLTextures.setTextureAt(this._sceneNormalTexUnit, null);
        GLTextures.setTextureAt(this._sceneSpecRoughTexUnit, null);
    }

    public processFinal(startTexUnit: number) {
        this._sceneColorTexUnit = startTexUnit;
        this._sceneDepthTexUnit = startTexUnit + 1;
        this._sceneNormalTexUnit = startTexUnit + 2;
        this._sceneSpecRoughTexUnit = startTexUnit + 3;
        this._customTexStartUnit = startTexUnit + 4;

        this.applyToneMapping();
    }
    
    private setTexture(location: WebGLUniformLocation | null, unit: number, texture: Texture) {
        if (location !== null) {
            GLDevice.gl.uniform1i(location, unit);
            GLTextures.setTextureAt(unit, texture);
        }
    }

    // private swapTempFBO() {
    //     if (this._curOutputFBOIdx === 0) {
    //         this._curOutputFBOIdx = 1;
    //     } else {
    //         this._curOutputFBOIdx = 0;
    //     }
    // }

    // private get currTempOutputFBO(): FrameBuffer {
    //     return this._tempFullSwapFBO[this._curOutputFBOIdx];
    // }

    // private get currTempSourceFBO(): FrameBuffer {
    //     return this._tempFullSwapFBO[1 - this._curOutputFBOIdx];
    // }

    private applySSAO() {
        const gl = GLDevice.gl;
        
        // 1. render ssao to half res result texture

        // render target and viewport
        GLDevice.renderTarget = this._ssaoFBO;
        gl.viewport(0, 0, this._ssaoTexture.width, this._ssaoTexture.height);
        gl.scissor(0, 0, this._ssaoTexture.width, this._ssaoTexture.height);

        // render states
        this._renderStates.apply();

        // use program
        GLPrograms.useProgram(this._ssaoProgram);

        // textures
        // GLTextures.setStartUnit(startTexUnit);

        // textures already bound before.
        // this._samplerUniformsSSAO.setTexture("s_sceneDepth", depthMap);
        // this._samplerUniformsSSAO.setTexture("s_sceneNormalRoughSpec", normalRoughSpec);
        gl.uniform1i(this._ssaoProgram.getUniformLocation("s_sceneDepth"), this._sceneDepthTexUnit);
        gl.uniform1i(this._ssaoProgram.getUniformLocation("s_sceneNormal"), this._sceneNormalTexUnit);
        // gl.uniform1i(this._ssaoProgram.getUniformLocation("s_sceneSpecRough"), this._sceneSpecRoughTexUnit);

        // this._samplerUniformsSSAO.setTexture("s_noiseTex", this.ssao.noiseTexture);
        this.setTexture(this._ssaoProgram.getUniformLocation("s_noiseTex"), this._customTexStartUnit, this.ssao.noiseTexture);

        // uniforms (blocks? how many uniforms can be shared by post processes?)
        // what params ssao need?
        let texelW = 1.0 / this._sceneDepthTexture.width;
        let texelH = 1.0 / this._sceneDepthTexture.height;
        
        // calc texel size
        gl.uniform2f(this._ssaoProgram.getUniformLocation("u_texelSize"), texelW, texelH);
        gl.uniform2f(this._ssaoProgram.getUniformLocation("u_noiseTexelSize"), 1.0 / this.ssao.noiseTexture.width, 1.0 / this.ssao.noiseTexture.height);

        // 3d sample kernels
        gl.uniform3fv(this._ssaoProgram.getUniformLocation("u_kernel"), this.ssao.kernels);

        // params
        // fix me: pack these together to a vec3? call gl api only 1 time
        gl.uniform1f(this._ssaoProgram.getUniformLocation("u_radius"), this.ssao.radius);
        gl.uniform1f(this._ssaoProgram.getUniformLocation("u_minDistance"), this.ssao.minDistance);
        gl.uniform1f(this._ssaoProgram.getUniformLocation("u_maxDistance"), this.ssao.maxDistance);

        // draw fullscr rect
        this._rectGeom.draw(0, Infinity, this._ssaoProgram.attributes);

        //----------------------------------------------------------------------

        // 2. composite half res ssao to source image
        GLDevice.renderTarget = this._postProcessFBO;
        gl.viewport(0, 0, this._sceneDepthTexture.width, this._sceneDepthTexture.height);
        gl.scissor(0, 0, this._sceneDepthTexture.width, this._sceneDepthTexture.height);

        // render state: multiply blend
        GLRenderStates.setBlendState(this._ssaoBlurBlendState);

        GLPrograms.useProgram(this._ssaoBlurProgram);

        // GLTextures.setStartUnit(startTexUnit);

        // this._samplerUniformsSSAOComposite.setTexture("s_sceneColor", sourceImage);
        // these two textures has already bound before
        // this._samplerUniformsSSAOComposite.setTexture("s_sceneDepth", depthMap);
        // this._samplerUniformsSSAOComposite.setTexture("s_sceneNormalRoughSpec", normalRoughSpec);

        // TODO: 优化：可以不用传入 sceneColor 纹理，而是通过 alphablend 做相乘混合
        // TODO: 需要注意 SSAO 在半透明之前做；如何实现？
        // this.setTexture(this._compositeSSAOProgram.getUniformLocation("s_sceneColor"), this._sceneColorTexUnit, sourceImage);
        gl.uniform1i(this._ssaoBlurProgram.getUniformLocation("s_sceneDepth"), this._sceneDepthTexUnit);
        gl.uniform1i(this._ssaoBlurProgram.getUniformLocation("s_sceneNormal"), this._sceneNormalTexUnit);
        this.setTexture(this._ssaoBlurProgram.getUniformLocation("s_aoTex"), this._customTexStartUnit, this._ssaoTexture);
        // this._samplerUniformsSSAOComposite.setTexture("s_aoTex", this._tempResultHalfTexture);

        // todo: uniforms
        // uniform float u_offset;
        texelW = 1.0 / this._ssaoTexture.width;
        texelH = 1.0 / this._ssaoTexture.height;
        gl.uniform2f(this._ssaoBlurProgram.getUniformLocation("u_offset"), this.ssao.blurSize * texelW, this.ssao.blurSize * texelH);

        // uniform float u_intensity;
        gl.uniform1f(this._ssaoBlurProgram.getUniformLocation("u_intensity"), this.ssao.intensiy);

        // uniform float u_power;
        gl.uniform1f(this._ssaoBlurProgram.getUniformLocation("u_power"), this.ssao.power);

        this._rectGeom.draw(0, Infinity, this._ssaoBlurProgram.attributes);

        // don't touch depth and normalroughspec
        GLTextures.setTextureAt(this._sceneColorTexUnit, null);
        GLTextures.setTextureAt(this._customTexStartUnit, null);
    }

    private generateSSR() {
        // todo: need prev frame image
        // throw new Error("Method not implemented.");
    }

    private composite() {
        // todo: composite ssr, fog... to rendertarget
    }

    private applyToneMapping() {
        if (this._postProcessFBO === null) {
            return;
        }
        // Fix me: 由于不能将 sourceImage 同时作为纹理和 render target，所以需要一个临时的纹理？
        // 或者直接在向主屏幕输出时做 tone mapping？
        const gl = GLDevice.gl;
        const sourceImage = this._postProcessFBO.getTexture(0);
        if (sourceImage === null) {
            return;
        }

        // 在整个渲染流程的最后向主屏幕输出
        // 在场景画面输出之后再绘制 UI等
        GLDevice.renderTarget = null;
        gl.viewport(0, 0, GLDevice.canvas.width, GLDevice.canvas.height);
        gl.scissor(0, 0, GLDevice.canvas.width, GLDevice.canvas.height);

        this._renderStates.apply();

        // 暂时先只做 tonemapping，将来再加 bloom
        GLPrograms.useProgram(this._toneMappingProgram);
        this.setTexture(this._toneMappingProgram.getUniformLocation("s_sceneColor"), this._customTexStartUnit, sourceImage);
        this._rectGeom.draw(0, Infinity, this._toneMappingProgram.attributes);
        GLTextures.setTextureAt(this._customTexStartUnit, null);
    }
}
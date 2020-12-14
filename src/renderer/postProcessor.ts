import samplers_postprocess from "./shaders/shaderIncludes/samplers_postprocess.glsl.js";
import fullscreen_rect_vs from "./shaders/fullscreen_rect_vs.glsl.js";
import postprocess_ssao_fs from "./shaders/postprocess_ssao_fs.glsl.js";
import postprocess_ssao_blur_fs from "./shaders/postprocess_ssao_blur_fs.glsl.js";
import postprocess_ssr_fs from "./shaders/postprocess_ssr_fs.glsl.js";
import postprocess_composite_fs from "./shaders/postprocess_composite_fs.glsl.js";
import postprocess_fog_fs from "./shaders/postprocess_fog_fs.glsl.js";
import postprocess_fxaa_fs from "./shaders/postprocess_fxaa_fs.glsl.js";
import postprocess_fxaa_vs from "./shaders/postprocess_fxaa_vs.glsl.js";
import postprocess_tonemapping_fs from "./shaders/postprocess_tonemapping_fs.glsl.js";
import postprocess_brightpass_fs from "./shaders/postprocess_brightpass_fs.glsl.js";
import postprocess_blur_fs from "./shaders/postprocess_blur_fs.glsl.js";
import postprocess_bloom_composite_fs from "./shaders/postprocess_bloom_composite_fs.glsl.js";

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
import vec4 from "../../lib/tsm/vec4.js";
import { BloomParams } from "./postprocess/bloomParams.js";
import vec2 from "../../lib/tsm/vec2.js";
import { FogParams } from "./postprocess/fogParams.js";
import { Camera } from "../scene/cameras/camera.js";
import { FXAAParams } from "./postprocess/fxaaParams.js";

/**
 * all post processes supported
 */
export class PostProcessor {

    public constructor(context: ClusteredForwardRenderContext, sceneDepthTex: Texture2D, sceneNormalTex: Texture2D, specRoughTex: Texture2D, envmapArrayUnit: number, specDFGUnit: number) {
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
        if (GLPrograms.shaderCodes["postprocess_brightpass_fs"] === undefined) {
            GLPrograms.shaderCodes["postprocess_brightpass_fs"] = postprocess_brightpass_fs;
        }
        if (GLPrograms.shaderCodes["postprocess_blur_fs"] === undefined) {
            GLPrograms.shaderCodes["postprocess_blur_fs"] = postprocess_blur_fs;
        }
        if (GLPrograms.shaderCodes["postprocess_composite_fs"] === undefined) {
            GLPrograms.shaderCodes["postprocess_composite_fs"] = postprocess_composite_fs;
        }
        if (GLPrograms.shaderCodes["postprocess_fog_fs"] === undefined) {
            GLPrograms.shaderCodes["postprocess_fog_fs"] = postprocess_fog_fs;
        }
        if (GLPrograms.shaderCodes["postprocess_tonemapping_fs"] === undefined) {
            GLPrograms.shaderCodes["postprocess_tonemapping_fs"] = postprocess_tonemapping_fs;
        }
        if (GLPrograms.shaderCodes["postprocess_bloom_composite_fs"] === undefined) {
            GLPrograms.shaderCodes["postprocess_bloom_composite_fs"] = postprocess_bloom_composite_fs;
        }
        if (GLPrograms.shaderCodes["postprocess_fxaa_fs"] === undefined) {
            GLPrograms.shaderCodes["postprocess_fxaa_fs"] = postprocess_fxaa_fs;
        }
        if (GLPrograms.shaderCodes["postprocess_fxaa_vs"] === undefined) {
            GLPrograms.shaderCodes["postprocess_fxaa_vs"] = postprocess_fxaa_vs;
        }

        if (GLPrograms.shaderCodes["samplers_postprocess"] === undefined) {
            GLPrograms.shaderCodes["samplers_postprocess"] = samplers_postprocess;
        }

        this._envMapArrayUnit = envmapArrayUnit;
        this._specularDFGUnit = specDFGUnit;

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

        this._fogProgram = new ShaderProgram();
        this._fogProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._fogProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["postprocess_fog_fs"]);
        this._fogProgram.build();

        this._fxaaProgram = new ShaderProgram();
        this._fxaaProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["postprocess_fxaa_vs"]);
        this._fxaaProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["postprocess_fxaa_fs"]);
        this._fxaaProgram.build();

        this._brightpassProgram = new ShaderProgram();
        this._brightpassProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._brightpassProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["postprocess_brightpass_fs"]);
        this._brightpassProgram.build();

        this._gaussianBlurProgram = new ShaderProgram();
        this._gaussianBlurProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._gaussianBlurProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["postprocess_blur_fs"]);
        this._gaussianBlurProgram.build();

        this._compositeProgram = new ShaderProgram();
        this._compositeProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._compositeProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["postprocess_composite_fs"]);
        this._compositeProgram.build();

        this._toneMappingProgram = new ShaderProgram();
        this._toneMappingProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._toneMappingProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["postprocess_tonemapping_fs"]);
        this._toneMappingProgram.build();

        this._bloomCompositeProgram = new ShaderProgram();
        this._bloomCompositeProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._bloomCompositeProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["postprocess_bloom_composite_fs"]);
        this._bloomCompositeProgram.build();

        // don't foget to bind the uniform blocks used.
        //GLUniformBuffers.bindUniformBlock(this._ssaoProgram, "View");
        //GLUniformBuffers.bindUniformBlock(this._ssaoBlurProgram, "View");

        context.bindUniformBlocks(this._ssaoProgram);
        context.bindUniformBlocks(this._ssaoBlurProgram);
        context.bindUniformBlocks(this._ssrProgram);
        context.bindUniformBlocks(this._fogProgram);
        context.bindUniformBlocks(this._fxaaProgram);
        context.bindUniformBlocks(this._brightpassProgram);
        context.bindUniformBlocks(this._gaussianBlurProgram);
        context.bindUniformBlocks(this._compositeProgram);
        context.bindUniformBlocks(this._toneMappingProgram);
        context.bindUniformBlocks(this._bloomCompositeProgram);

        // this._context = context;

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
        this._ssaoFBO.attachTexture(0, this._ssaoTexture);
        this._ssaoFBO.prepare();

        this._ssrTexture = new Texture2D(sceneDepthTex.width / 2, sceneDepthTex.height / 2, 1, 1, GLDevice.gl.RGBA, GLDevice.gl.HALF_FLOAT);
        this._ssrTexture.samplerState = new SamplerState(GLDevice.gl.CLAMP_TO_EDGE, GLDevice.gl.CLAMP_TO_EDGE);
        this._ssrTexture.create();

        this._ssrFBO = new FrameBuffer();
        this._ssrFBO.attachTexture(0, this._ssrTexture);
        this._ssrFBO.prepare();

        const startSubDiv: number = 4;
        let levelWidth = Math.max(2, Math.round(sceneDepthTex.width / startSubDiv));
        let levelHeight = Math.max(2, Math.round(sceneDepthTex.height / startSubDiv));

        this._brightPassTexture = new Texture2D(levelWidth, levelHeight, 1, 1, GLDevice.gl.RGBA, GLDevice.gl.HALF_FLOAT);
        this._brightPassTexture.samplerState = new SamplerState(GLDevice.gl.CLAMP_TO_EDGE, GLDevice.gl.CLAMP_TO_EDGE);
        this._brightPassTexture.create();

        this._brightPassFBO = new FrameBuffer();
        this._brightPassFBO.attachTexture(0, this._brightPassTexture);
        this._brightPassFBO.prepare();

        this._numBloomLevels = 5;
        this._bloomHorizTextures = [];
        this._bloomVertiTextures = [];
        this._bloomHorizFBOs = [];
        this._bloomVertiFBOs = [];
        this._bloomTexUniforms = [];
        this._bloomTintColors = [];

        for(let i = 0; i < this._numBloomLevels; i++) {
            const horizTex: Texture2D = new Texture2D(levelWidth, levelHeight, 1, 1, GLDevice.gl.RGBA, GLDevice.gl.HALF_FLOAT);
            horizTex.samplerState = new SamplerState(GLDevice.gl.CLAMP_TO_EDGE, GLDevice.gl.CLAMP_TO_EDGE);
            horizTex.create();

            this._bloomHorizTextures.push(horizTex);
    
            const horizFBO = new FrameBuffer();
            horizFBO.attachTexture(0, horizTex);
            horizFBO.prepare();

            this._bloomHorizFBOs.push(horizFBO);

            const vertiTex: Texture2D = new Texture2D(levelWidth, levelHeight, 1, 1, GLDevice.gl.RGBA, GLDevice.gl.HALF_FLOAT);
            vertiTex.samplerState = new SamplerState(GLDevice.gl.CLAMP_TO_EDGE, GLDevice.gl.CLAMP_TO_EDGE);
            vertiTex.create();

            this._bloomVertiTextures.push(vertiTex);
    
            const vertiFBO = new FrameBuffer();
            vertiFBO.attachTexture(0, vertiTex);
            vertiFBO.prepare();

            this._bloomVertiFBOs.push(vertiFBO);

            levelWidth = Math.max(2, Math.round(levelWidth / 2));
            levelHeight = Math.max(2, Math.round(levelHeight / 2));

            this._bloomTexUniforms.push("s_bloomTex" + i);
            // 5 vec3 values
            this._bloomTintColors.push(1.0); this._bloomTintColors.push(1.0); this._bloomTintColors.push(1.0);
        }

        this._tmpTexture = new Texture2D(sceneDepthTex.width, sceneDepthTex.height, 1, 1, GLDevice.gl.RGBA, GLDevice.gl.HALF_FLOAT, false);
        this._tmpTexture.samplerState = new SamplerState(GLDevice.gl.CLAMP_TO_EDGE, GLDevice.gl.CLAMP_TO_EDGE);
        this._tmpTexture.create();

        this._tmpFBO = new FrameBuffer();
        this._tmpFBO.attachTexture(0, this._tmpTexture);
        this._tmpFBO.prepare();

        // diable alpha blending
        this._renderStates = new RenderStateSet();
        this._renderStates.blendState = RenderStateCache.instance.getBlendState(false, GLDevice.gl.FUNC_ADD, GLDevice.gl.SRC_ALPHA, GLDevice.gl.ONE_MINUS_SRC_ALPHA);
        this._renderStates.colorWriteState = RenderStateCache.instance.getColorWriteState(true, true, true, true);
        this._renderStates.cullState = RenderStateCache.instance.getCullState(false, GLDevice.gl.BACK);
        this._renderStates.depthState = RenderStateCache.instance.getDepthStencilState(false, false, GLDevice.gl.ALWAYS);

        // multiply ssao with scene color
        // srccolor * destcolor + destcolor * 0
        this._ssaoBlurBlendState = RenderStateCache.instance.getBlendState(true, GLDevice.gl.FUNC_ADD, GLDevice.gl.DST_COLOR, GLDevice.gl.ZERO);
        // debug ssao
        // this._ssaoBlurBlendState = RenderStateCache.instance.getBlendState(false, GLDevice.gl.FUNC_ADD, GLDevice.gl.DST_COLOR, GLDevice.gl.ZERO);
        
        // use color ADD blend mode
        // diffuse + specular
        // if some surface's reflection is strong, it's diffuse must be dark. this is ensured by 'metallic' of it's PBR material.
        this._compositeBlendState = RenderStateCache.instance.getBlendState(true, GLDevice.gl.FUNC_ADD, GLDevice.gl.ONE, GLDevice.gl.ONE);

        // alpha blend mode for fog
        // srcColor * scrAlpha + destColor * (1 - srcAlpha)
        this._fogBlendState = RenderStateCache.instance.getBlendState(true, GLDevice.gl.FUNC_ADD, GLDevice.gl.SRC_ALPHA, GLDevice.gl.ONE_MINUS_SRC_ALPHA);

        this._rectGeom = new PlaneGeometry(2, 2, 1, 1);

        this._blurUnitOffset = new vec2();

        this._ssao = new SSAOParams();
        this._ssr = new SSRParams();
        this._bloom = new BloomParams();
        this._fog = new FogParams();
        this._fxaa = new FXAAParams();
    }

    public release() {
        if (this._ssaoProgram) { this._ssaoProgram.release(); }
        if (this._ssaoBlurProgram) { this._ssaoBlurProgram.release(); }
        if (this._ssrProgram) { this._ssrProgram.release(); }
        if (this._fogProgram) { this._fogProgram.release(); }
        if (this._fxaaProgram) { this._fxaaProgram.release(); }
        if (this._brightpassProgram) { this._brightpassProgram.release(); }
        if (this._gaussianBlurProgram) { this._gaussianBlurProgram.release(); }
        if (this._compositeProgram) { this._compositeProgram.release(); }
        if (this._toneMappingProgram) {this._toneMappingProgram.release();}
        if (this._bloomCompositeProgram) {this._bloomCompositeProgram.release();}
        if (this._ssaoFBO) { this._ssaoFBO.release(); }
        if (this._ssaoTexture) { this._ssaoTexture.release(); }
        if (this._ssrFBO) { this._ssrFBO.release(); }
        if (this._ssrTexture) { this._ssrTexture.release(); }
        for (const tex of this._bloomHorizTextures) {if (tex) tex.release();}
        for (const tex of this._bloomVertiTextures) {if (tex) tex.release();}
        for (const fbo of this._bloomHorizFBOs) {if (fbo) fbo.release();}
        for (const fbo of this._bloomVertiFBOs) {if (fbo) fbo.release();}
        this._bloomHorizTextures = [];
        this._bloomHorizFBOs = [];
        if (this._tmpFBO) {this._tmpFBO.release();}
        if (this._tmpTexture) {this._tmpTexture.release();}
        if (this._rectGeom) { this._rectGeom.destroy(); }
    }

    //public enableFXAA: boolean = true;
    public enableToneMapping: boolean = true;
    // todo: other post processing effects: color grading, glow...

    public get ssao(): SSAOParams {return this._ssao;}
    public get ssr(): SSRParams {return this._ssr;}
    public get bloom(): BloomParams {return this._bloom;}
    public get fog(): FogParams {return this._fog;}
    public get fxaa(): FXAAParams {return this._fxaa;}

    private _ssao: SSAOParams;
    private _ssr: SSRParams;
    private _bloom: BloomParams;
    private _fog: FogParams;
    private _fxaa: FXAAParams;

    // shaders

    private _ssaoProgram: ShaderProgram;
    private _ssaoBlurProgram: ShaderProgram;
    private _ssrProgram: ShaderProgram;
    private _fogProgram: ShaderProgram;
    private _fxaaProgram: ShaderProgram;
    private _brightpassProgram: ShaderProgram;
    private _gaussianBlurProgram: ShaderProgram;
    private _compositeProgram: ShaderProgram;
    private _toneMappingProgram: ShaderProgram;
    private _bloomCompositeProgram: ShaderProgram;
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

    // todo: optimze: reruse ssao and ssr textures?
    private _brightPassTexture: Texture2D;
    private _brightPassFBO: FrameBuffer;
    private _numBloomLevels: number;
    private _bloomHorizTextures: Texture2D[];
    private _bloomVertiTextures: Texture2D[];
    private _bloomHorizFBOs: FrameBuffer[];
    private _bloomVertiFBOs: FrameBuffer[];

    /**
     * full - size temporary render target
     * now used by fxaa
     */
    private _tmpTexture: Texture2D;
    private _tmpFBO: FrameBuffer;

    private _bloomTexUniforms: string[];
    private _bloomLevelFactors: number[] = [1.0, 0.8, 0.6, 0.4, 0.2];
    private _bloomTintColors: number[];

    // todo: last frame image
    // 使用两个交替的 framebuffer，还是每帧最后拷贝一下？
    // 交替的开销更小一些？由 renderer 维护，负责每帧交替地传进来？

    private _renderStates: RenderStateSet;
    private _ssaoBlurBlendState: BlendState;
    private _compositeBlendState: BlendState;
    private _fogBlendState: BlendState;
    // glow pass can use _compositeBlendState also.

    private _rectGeom: PlaneGeometry;

    // common texture units
    private _sceneDepthTexture: Texture2D;
    private _sceneNormalTexture: Texture2D;
    private _sceneSpecRoughTexture: Texture2D;

    private _envMapArrayUnit: number = 0;
    private _specularDFGUnit: number = 0;
    private _sceneColorTexUnit: number = 0;
    private _sceneDepthTexUnit: number = 0;
    private _sceneNormalTexUnit: number = 0;
    private _sceneSpecRoughTexUnit: number = 0;

    // start unit for custom textures of every effects
    private _customTexStartUnit: number = 0;

    private _blurUnitOffset: vec2;

    // private _context: ClusteredForwardRenderContext;

    public processOpaque(startTexUnit: number, target: FrameBuffer, prevFrame: Texture2D, camera: Camera) {
        // todo: bind general texturess for once
        this._sceneColorTexUnit = startTexUnit;
        this._sceneDepthTexUnit = startTexUnit + 1;
        this._sceneNormalTexUnit = startTexUnit + 2;
        this._sceneSpecRoughTexUnit = startTexUnit + 3;
        this._customTexStartUnit = startTexUnit + 4;

        this._postProcessFBO = target;
        this._prevFrame = prevFrame;

        GLDevice.renderTarget = target;

        // this._renderStates.apply();

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

        if (this.fog.enable) {
            this.applyFog(camera);
        }

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

        // bloom should be applied before tone mapping
        // http://www.adriancourreges.com/blog/2016/09/09/doom-2016-graphics-study/
        if (this.bloom.enable) {
            this.applyBloom();
        }
        this.applyToneMapping();

        // fxaa only works after tone mapping
        if (this.fxaa.enable) {
            this.applyFXAA();
        }
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
        const ssao = this._ssao;
        
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
        gl.uniform2f(this._ssaoProgram.getUniformLocation("u_noiseTexelSize"), 1.0 / ssao.noiseTexture.width, 1.0 / this.ssao.noiseTexture.height);

        // 3d sample kernels
        gl.uniform3fv(this._ssaoProgram.getUniformLocation("u_kernel"), ssao.kernels);

        // params
        // fix me: pack these together to a vec3? call gl api only 1 time
        gl.uniform1f(this._ssaoProgram.getUniformLocation("u_radius"), ssao.radius);
        gl.uniform1f(this._ssaoProgram.getUniformLocation("u_minDistance"), ssao.minDistance);
        gl.uniform1f(this._ssaoProgram.getUniformLocation("u_maxDistance"), ssao.maxDistance);

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

        // uniforms
        // uniform float u_offset;
        texelW = 1.0 / this._ssaoTexture.width;
        texelH = 1.0 / this._ssaoTexture.height;
        gl.uniform2f(this._ssaoBlurProgram.getUniformLocation("u_offset"), ssao.blurSize * texelW, this.ssao.blurSize * texelH);

        // uniform float u_intensity;
        gl.uniform1f(this._ssaoBlurProgram.getUniformLocation("u_intensity"), ssao.intensiy);

        // uniform float u_power;
        gl.uniform1f(this._ssaoBlurProgram.getUniformLocation("u_power"), ssao.power);

        this._rectGeom.draw(0, Infinity, this._ssaoBlurProgram.attributes);

        // don't touch depth and normalroughspec
        GLTextures.setTextureAt(this._sceneColorTexUnit, null);
        GLTextures.setTextureAt(this._customTexStartUnit, null);
    }

    private generateSSR() {
        const gl = GLDevice.gl;
        
        GLDevice.renderTarget = this._ssrFBO;
        gl.viewport(0, 0, this._ssrTexture.width, this._ssrTexture.height);
        gl.scissor(0, 0, this._ssrTexture.width, this._ssrTexture.height);

        GLDevice.clearColor = new vec4([0, 0, 0, 0]);
        GLDevice.clear(true, false, false);

        // render states
        this._renderStates.apply();

        GLPrograms.useProgram(this._ssrProgram);

        // texture samplers
        // prev frame image
        GLTextures.setTextureAt(this._sceneColorTexUnit, this._prevFrame);
        gl.uniform1i(this._ssrProgram.getUniformLocation("s_sceneColor"), this._sceneColorTexUnit);
        gl.uniform1i(this._ssrProgram.getUniformLocation("s_sceneDepth"), this._sceneDepthTexUnit);
        gl.uniform1i(this._ssrProgram.getUniformLocation("s_sceneNormal"), this._sceneNormalTexUnit);
        gl.uniform1i(this._ssrProgram.getUniformLocation("s_sceneSpecRough"), this._sceneSpecRoughTexUnit);

        // uniforms
        // all uniform values are inited in glsl code
        const ssr = this._ssr;
        gl.uniform1f(this._ssrProgram.getUniformLocation("maxRayDistance"), ssr.maxRayDistance);
        gl.uniform1f(this._ssrProgram.getUniformLocation("pixelStride"), ssr.pixelStride);
        gl.uniform1f(this._ssrProgram.getUniformLocation("pixelStrideZCutoff"), ssr.pixelStrideZCutoff);
        gl.uniform1f(this._ssrProgram.getUniformLocation("screenEdgeFadeStart"), ssr.screenEdgeFadeStart);
        gl.uniform1f(this._ssrProgram.getUniformLocation("eyeFadeStart"), ssr.eyeFadeStart);
        gl.uniform1f(this._ssrProgram.getUniformLocation("eyeFadeEnd"), ssr.eyeFadeEnd);
        gl.uniform1f(this._ssrProgram.getUniformLocation("minGlossiness"), ssr.minGlossiness);
        gl.uniform1f(this._ssrProgram.getUniformLocation("zThicknessThreshold"), ssr.zThicknessThreshold);
        gl.uniform1f(this._ssrProgram.getUniformLocation("jitterOffset"), ssr.jitterOffset);

        this._rectGeom.draw(0, Infinity, this._ssrProgram.attributes);

        // clear textures
        GLTextures.setTextureAt(this._sceneColorTexUnit, null);

        // throw new Error("Method not implemented.");
    }

    private composite() {
        const gl = GLDevice.gl;
        // todo: composite ssr, fog... to rendertarget
        // blur ssr use a bilateral filter
        GLDevice.renderTarget = this._postProcessFBO;

        // fix me: support camera viewport?

        gl.viewport(0, 0, this._sceneDepthTexture.width, this._sceneDepthTexture.height);
        gl.scissor(0, 0, this._sceneDepthTexture.width, this._sceneDepthTexture.height);

        this._renderStates.apply();

        GLRenderStates.setBlendState(this._compositeBlendState);

        GLPrograms.useProgram(this._compositeProgram);

        // textures
        const aoUnit = this._customTexStartUnit;
        const reflUnit = this._customTexStartUnit + 1;

        this.setTexture(this._compositeProgram.getUniformLocation("s_aoTex"), aoUnit, this._ssaoTexture);
        this.setTexture(this._compositeProgram.getUniformLocation("s_reflTex"), reflUnit, this._ssrTexture);

        gl.uniform1i(this._compositeProgram.getUniformLocation("s_envMapArray"), this._envMapArrayUnit);
        gl.uniform1i(this._compositeProgram.getUniformLocation("s_specularDFG"), this._specularDFGUnit);
        gl.uniform1i(this._compositeProgram.getUniformLocation("s_sceneDepth"), this._sceneDepthTexUnit);
        gl.uniform1i(this._compositeProgram.getUniformLocation("s_sceneNormal"), this._sceneNormalTexUnit);
        gl.uniform1i(this._compositeProgram.getUniformLocation("s_sceneSpecRough"), this._sceneSpecRoughTexUnit);

        // uniforms
        const texelW = 1.0 / this._ssrTexture.width;
        const texelH = 1.0 / this._ssrTexture.height;
        gl.uniform2f(this._compositeProgram.getUniformLocation("u_offset"), this.ssr.blurSize * texelW, this.ssr.blurSize * texelH);
        gl.uniform1f(this._compositeProgram.getUniformLocation("u_ssrAmount"), this.ssr.enable ? 1.0 : 0.0);
        gl.uniform1f(this._compositeProgram.getUniformLocation("u_aoAmount"), this.ssao.enable ? 1.0 : 0.0);    //NOTE: affect specular ao only

        this._rectGeom.draw(0, Infinity, this._compositeProgram.attributes);

        // clear textures;
        GLTextures.setTextureAt(aoUnit, null);
        GLTextures.setTextureAt(reflUnit, null);
    }

    applyFog(camera: Camera) {
        const gl = GLDevice.gl;
        const fog = this._fog;
        // render target
        GLDevice.renderTarget = this._postProcessFBO;
        gl.viewport(0, 0, this._sceneDepthTexture.width, this._sceneDepthTexture.height);
        gl.scissor(0, 0, this._sceneDepthTexture.width, this._sceneDepthTexture.height);

        // apply render state
        this._renderStates.apply();

        GLRenderStates.setBlendState(this._fogBlendState);

        // program
        GLPrograms.useProgram(this._fogProgram);

        // textures
        // need depth only?
        gl.uniform1i(this._fogProgram.getUniformLocation("s_sceneDepth"), this._sceneDepthTexUnit);

        // params
        // todo: pack to vec4s to reduce api calls
        // gl.uniform1f(this._fogProgram.getUniformLocation("u_density"), this.fog.density);
        // gl.uniform1i(this._fogProgram.getUniformLocation("u_halfSpace"), this.fog.halfSpace ? 1 : 0);
        
        // calc fog height density
        // exp2(x) in glsl means pow(2, x)
        const heightFactor: number = Math.max(-127.0, this.fog.heightFalloff * (camera.position.y - this.fog.height));
        const heightDensity: number = fog.density * Math.pow(2.0, -heightFactor);
        
        // gl.uniform1f(this._fogProgram.getUniformLocation("u_fogHeightDensity"), heightDensity);
        // gl.uniform1f(this._fogProgram.getUniformLocation("u_heightFalloff"), this.fog.heightFalloff);
        // gl.uniform1f(this._fogProgram.getUniformLocation("u_startDist"), this.fog.startDistance);
        // gl.uniform1f(this._fogProgram.getUniformLocation("u_endDist"), this.fog.endDistance);
        gl.uniform4f(this._fogProgram.getUniformLocation("u_fogParams"),
            heightDensity, fog.heightFalloff, fog.startDistance, fog.endDistance);
        gl.uniform3f(this._fogProgram.getUniformLocation("u_color"), fog.color.x, fog.color.y, fog.color.z);

        // draw fullscreen rect
        this._rectGeom.draw(0, Infinity, this._fogProgram.attributes);

        // clear textures
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

        if (this.fxaa.enable) {
            // todo: 需要向一个 LDR 的 RT 输出，用于 FXAA
            GLDevice.renderTarget = this._tmpFBO;
        } else {
            GLDevice.renderTarget = null;
        }
        gl.viewport(0, 0, GLDevice.canvas.width, GLDevice.canvas.height);
        gl.scissor(0, 0, GLDevice.canvas.width, GLDevice.canvas.height);

        this._renderStates.apply();

        GLPrograms.useProgram(this._toneMappingProgram);
        this.setTexture(this._toneMappingProgram.getUniformLocation("s_sceneColor"), this._customTexStartUnit, sourceImage);
        gl.uniform1i(this._toneMappingProgram.getUniformLocation("u_Enable"), this.enableToneMapping ? 1 : 0);
        this._rectGeom.draw(0, Infinity, this._toneMappingProgram.attributes);
        GLTextures.setTextureAt(this._customTexStartUnit, null);
    }

    private applyBloom() {
        // https://github.com/mrdoob/three.js/blob/dev/examples/js/postprocessing/UnrealBloomPass.js
        // https://docs.unrealengine.com/latest/INT/Engine/Rendering/PostProcessEffects/Bloom/
        if (this._postProcessFBO === null) {
            return;
        }

        const gl = GLDevice.gl;
        const sourceImage = this._postProcessFBO.getTexture(0);
        if (sourceImage === null) {
            return;
        }

        // 先做 brightpass，将高亮部分的像素绘制到一个低分辨率 FBO 上
        GLDevice.renderTarget = this._brightPassFBO;
        gl.viewport(0, 0, this._brightPassTexture.width, this._brightPassTexture.height);
        gl.scissor(0, 0, this._brightPassTexture.width, this._brightPassTexture.height);

        this._renderStates.apply();

        GLPrograms.useProgram(this._brightpassProgram);
        this.setTexture(this._brightpassProgram.getUniformLocation("s_sceneColor"), this._customTexStartUnit, sourceImage);
        gl.uniform1f(this._brightpassProgram.getUniformLocation("u_threshold"), this.bloom.threshold);
        // gl.uniform1f(this._brightpassProgram.getUniformLocation("u_intensity"), this.bloom.intensity);
        this._rectGeom.draw(0, Infinity, this._brightpassProgram.attributes);

        let curSourceTex = this._brightPassTexture;

        for (let i = 0; i < this._numBloomLevels; i++) {
            // 然后做横向 blur
            GLDevice.renderTarget = this._bloomHorizFBOs[i];
            gl.viewport(0, 0, this._bloomHorizTextures[i].width, this._bloomHorizTextures[i].height);
            gl.scissor(0, 0, this._bloomHorizTextures[i].width, this._bloomHorizTextures[i].height);
            // must use same texel size for horiz and verti blur, or the bloom shape will not be a sphere
            this._blurUnitOffset.x = 1.0 / this._bloomHorizTextures[i].width;
            this._blurUnitOffset.y = 0;
            GLPrograms.useProgram(this._gaussianBlurProgram);
            this.setTexture(this._gaussianBlurProgram.getUniformLocation("s_source"), this._customTexStartUnit, curSourceTex);
            gl.uniform2f(this._gaussianBlurProgram.getUniformLocation("u_unitOffset"), this._blurUnitOffset.x, this._blurUnitOffset.y);
            this._rectGeom.draw(0, Infinity, this._gaussianBlurProgram.attributes);

            curSourceTex = this._bloomHorizTextures[i];

            // 纵向 blur
            GLDevice.renderTarget = this._bloomVertiFBOs[i];
            // must use same texel size for horiz and verti blur, or the bloom shape will not be a sphere
            this._blurUnitOffset.x = 0;
            this._blurUnitOffset.y = 1.0 / this._bloomVertiTextures[i].height;
            this.setTexture(this._gaussianBlurProgram.getUniformLocation("s_source"), this._customTexStartUnit, curSourceTex);
            gl.uniform2f(this._gaussianBlurProgram.getUniformLocation("u_unitOffset"), this._blurUnitOffset.x, this._blurUnitOffset.y);
            this._rectGeom.draw(0, Infinity, this._gaussianBlurProgram.attributes);

            curSourceTex = this._bloomVertiTextures[i];
        }

        // todo: 将所有 mip level 的 bloom texture 组合输出到主表面
        GLDevice.renderTarget = this._postProcessFBO;
        gl.viewport(0, 0, GLDevice.canvas.width, GLDevice.canvas.height);
        gl.scissor(0, 0, GLDevice.canvas.width, GLDevice.canvas.height);

        GLRenderStates.setBlendState(this._compositeBlendState);

        GLPrograms.useProgram(this._bloomCompositeProgram);
        for(let i = 0; i < this._numBloomLevels; i++) {
            this.setTexture(this._bloomCompositeProgram.getUniformLocation(this._bloomTexUniforms[i]), this._customTexStartUnit + i, this._bloomVertiTextures[i]);
        }
        gl.uniform1f(this._bloomCompositeProgram.getUniformLocation("u_intensity"), this.bloom.intensity);
        gl.uniform1f(this._bloomCompositeProgram.getUniformLocation("u_bloomRadius"), this.bloom.radius);
        gl.uniform1fv(this._bloomCompositeProgram.getUniformLocation("u_bloomFactors"), this._bloomLevelFactors);
        gl.uniform3fv(this._bloomCompositeProgram.getUniformLocation("u_bloomTintColors"), this._bloomTintColors);
        this._rectGeom.draw(0, Infinity, this._bloomCompositeProgram.attributes);
        
        // clean up
        for(let i = 0; i < this._numBloomLevels; i++) {
            GLTextures.setTextureAt(this._customTexStartUnit + i, null);
        }
    }

    private applyFXAA() {

        const gl = GLDevice.gl;
        GLDevice.renderTarget = null;
        gl.viewport(0, 0, GLDevice.canvas.width, GLDevice.canvas.height);
        gl.scissor(0, 0, GLDevice.canvas.width, GLDevice.canvas.height);
        this._renderStates.apply();

        GLPrograms.useProgram(this._fxaaProgram);
        this.setTexture(this._fxaaProgram.getUniformLocation("s_source"), this._customTexStartUnit, this._tmpTexture);
        gl.uniform2f(this._fxaaProgram.getUniformLocation("u_texelSize"), 1.0 / this._tmpTexture.width, 1.0 / this._tmpTexture.height);
        this._rectGeom.draw(0, Infinity, this._fxaaProgram.attributes);
        GLTextures.setTextureAt(this._customTexStartUnit, null);
    }
}
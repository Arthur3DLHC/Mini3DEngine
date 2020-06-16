import samplers_postprocess from "./shaders/shaderIncludes/samplers_postprocess.glsl.js";
import fullscreen_rect_vs from "./shaders/fullscreen_rect_vs.glsl.js";
import postprocess_ssao_fs from "./shaders/postprocess_ssao_fs.glsl.js";
import postprocess_ssao_composite_fs from "./shaders/postprocess_ssao_composite_fs.glsl.js";

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

/**
 * all post processes supported
 */
export class PostProcessor {
    public constructor(width: number, height: number) {
        // register shader codes
        if (GLPrograms.shaderCodes["fullscreen_rect_vs"] === undefined) {
            GLPrograms.shaderCodes["fullscreen_rect_vs"] = fullscreen_rect_vs;
        }
        if (GLPrograms.shaderCodes["postprocess_ssao_fs"] === undefined) {
            GLPrograms.shaderCodes["postprocess_ssao_fs"] = postprocess_ssao_fs;
        }
        if (GLPrograms.shaderCodes["postprocess_ssao_composite_fs"] === undefined) {
            GLPrograms.shaderCodes["postprocess_ssao_composite_fs"] = postprocess_ssao_composite_fs;
        }

        if (GLPrograms.shaderCodes["samplers_postprocess"] === undefined) {
            GLPrograms.shaderCodes["samplers_postprocess"] = samplers_postprocess;
        }

        // create shaders
        this._ssaoProgram = new ShaderProgram();
        this._ssaoProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._ssaoProgram.fragmentShaderCode = GLPrograms.processSourceCode(
            "#define NUM_KERNELS " + PostProcessor._numSSAOKernels + "\n"
            + GLPrograms.shaderCodes["postprocess_ssao_fs"]);
        this._ssaoProgram.build();

        this._combineSSAOProgram = new ShaderProgram();
        this._combineSSAOProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._combineSSAOProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["postprocess_ssao_composite_fs"]);
        this._combineSSAOProgram.build();

        this._samplerUniformsSSAO = new SamplerUniforms(this._ssaoProgram);
        this._samplerUniformsSSAOCombine = new SamplerUniforms(this._combineSSAOProgram);

        // create temp textures and framebuffers
        this._tempResultHalfTexture = new Texture2D();
        this._tempResultHalfTexture.width = width / 2;
        this._tempResultHalfTexture.height = height / 2;
        this._tempResultHalfTexture.depth = 1;
        this._tempResultHalfTexture.mipLevels = 1;
        this._tempResultHalfTexture.format = GLDevice.gl.RGBA;
        this._tempResultHalfTexture.componentType = GLDevice.gl.HALF_FLOAT;
        this._tempResultHalfTexture.samplerState = new SamplerState(GLDevice.gl.CLAMP_TO_EDGE, GLDevice.gl.CLAMP_TO_EDGE);
        this._tempResultHalfTexture.create();

        this._tempResultHalfFBO = new FrameBuffer();
        this._tempResultHalfFBO.setTexture(0, this._tempResultHalfTexture);
        this._tempResultHalfFBO.prepare();

        this._renderStates = new RenderStateSet();
        this._renderStates.blendState = RenderStateCache.instance.getBlendState(false, GLDevice.gl.FUNC_ADD, GLDevice.gl.SRC_ALPHA, GLDevice.gl.ONE_MINUS_SRC_ALPHA);
        this._renderStates.colorWriteState = RenderStateCache.instance.getColorWriteState(true, true, true, true);
        this._renderStates.cullState = RenderStateCache.instance.getCullState(false, GLDevice.gl.BACK);
        this._renderStates.depthState = RenderStateCache.instance.getDepthStencilState(false, false, GLDevice.gl.ALWAYS);

        this._rectGeom = new PlaneGeometry(2, 2, 1, 1);

        // generate noise texture? by upload image data to texture?
        // generation method is in three.js SSAOPass.js generateRandomKernelRotations() function
        this._ssaoNoiseTexture = new Texture2D();
        this._ssaoNoiseTexture.width = 4;
        this._ssaoNoiseTexture.height = 4;

        this._ssaoNoiseTexture.create();
    }

    public enableSSAO: boolean = true;
    public enableSSR: boolean = true;
    public enableFXAA: boolean = true;
    public enableGlow: boolean = true;
    public enableToneMapping: boolean = true;
    // todo: other post processing effects: color grading, glow...

    // todo: shaders
    private static readonly _numSSAOKernels = 32;

    private _ssaoProgram: ShaderProgram;
    private _combineSSAOProgram: ShaderProgram;
    private _samplerUniformsSSAO: SamplerUniforms;
    private _samplerUniformsSSAOCombine: SamplerUniforms;

    // todo: temp textures and framebuffers
    private _ssaoNoiseTexture: Texture2D;
    /**
     * half res temp result image
     * can be used to store unblurred SSAO/SSR, brightpass and so on
     */
    private _tempResultHalfTexture: Texture2D;
    private _tempResultHalfFBO: FrameBuffer;

    private _renderStates: RenderStateSet;
    private _rectGeom: PlaneGeometry;

    public process(sourceImage: Texture2D, depthMap: Texture2D, normalRoughSpec: Texture2D, startTexUnit: number, output: FrameBuffer) {
        // todo: apply all enabled processes together
        if (this.enableSSAO) {
            this.applySSAO(sourceImage, depthMap, normalRoughSpec, startTexUnit, output);
        }


    }

    private applySSAO(sourceImage: Texture2D, depthMap: Texture2D, normalRoughSpec: Texture2D, startTexUnit: number, output: FrameBuffer) {
        const gl = GLDevice.gl;
        
        // 1. render ssao to half res result texture

        // render target and viewport
        GLDevice.renderTarget = this._tempResultHalfFBO;
        gl.viewport(0, 0, this._tempResultHalfTexture.width, this._tempResultHalfTexture.height);
        gl.scissor(0, 0, this._tempResultHalfTexture.width, this._tempResultHalfTexture.height);

        // render states
        this._renderStates.apply();

        // use program
        GLPrograms.useProgram(this._ssaoProgram);

        // textures
        GLTextures.setStartUnit(startTexUnit);

        this._samplerUniformsSSAO.setTexture("s_sceneDepth", depthMap);
        this._samplerUniformsSSAO.setTexture("s_sceneNormalRoughSpec", normalRoughSpec);
        // todo: noise texture
        // fix me: how to load noise texture? or generate it?

        // uniforms (blocks? how many uniforms can be shared by post processes?)
        // what params ssao need?
        // get uniform locations here, or get them when init?
        
        // calc texel size

        // kernel weights

        // radius

        // min and max distance

        // draw fullscr rect
        this._rectGeom.draw(0, Infinity, this._ssaoProgram.attributes);

        // 2. composite half res ssao and source image together?
    }
}
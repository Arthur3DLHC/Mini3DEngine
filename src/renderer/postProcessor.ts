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
import vec3 from "../../lib/tsm/vec3.js";
import { Halton } from "../math/halton.js";
import { SSAOParams } from "./postprocess/ssaoParams.js";
import { Texture } from "../WebGLResources/textures/texture.js";

/**
 * all post processes supported
 */
export class PostProcessor {

    public constructor(width: number, height: number, startTextureUnit: number) {
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
            "#define NUM_KERNELS " + SSAOParams.numKernels + "\n"
            + GLPrograms.shaderCodes["postprocess_ssao_fs"]);
        this._ssaoProgram.build();

        this._compositeSSAOProgram = new ShaderProgram();
        this._compositeSSAOProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._compositeSSAOProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["postprocess_ssao_composite_fs"]);
        this._compositeSSAOProgram.build();

        // this._samplerUniformsSSAO = new SamplerUniforms(this._ssaoProgram);
        // this._samplerUniformsSSAOComposite = new SamplerUniforms(this._compositeSSAOProgram);

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
        

        this.ssao = new SSAOParams();
    }

    public enableSSR: boolean = true;
    public enableFXAA: boolean = true;
    public enableGlow: boolean = true;
    public enableToneMapping: boolean = true;
    // todo: other post processing effects: color grading, glow...

    public ssao: SSAOParams;

    // todo: shaders

    private _ssaoProgram: ShaderProgram;
    private _compositeSSAOProgram: ShaderProgram;
    // private _samplerUniformsSSAO: SamplerUniforms;
    // private _samplerUniformsSSAOComposite: SamplerUniforms;

    // todo: temp textures and framebuffers

    /**
     * half res temp result image
     * can be used to store unblurred SSAO/SSR, brightpass and so on
     */
    private _tempResultHalfTexture: Texture2D;
    private _tempResultHalfFBO: FrameBuffer;

    private _renderStates: RenderStateSet;
    private _rectGeom: PlaneGeometry;

    // common texture units
    private _sceneColorTexUnit: number = 0;
    private _sceneDepthTexUnit: number = 0;
    private _normalRoughSpecTexUnit: number = 0;

    // start unit for custom textures of every effects
    private _customTexStartUnit: number = 0;

    public process(source: FrameBuffer, depthMap: Texture2D, normalRoughSpec: Texture2D, startTexUnit: number, output: FrameBuffer) {
        // todo: bind general texturess for once
        this._sceneColorTexUnit = startTexUnit;
        this._sceneDepthTexUnit = startTexUnit + 1;
        this._normalRoughSpecTexUnit = startTexUnit + 2;
        this._customTexStartUnit = startTexUnit + 3;

        GLTextures.setTextureAt(this._sceneDepthTexUnit, depthMap);
        GLTextures.setTextureAt(this._normalRoughSpecTexUnit, normalRoughSpec);

        // todo: apply all enabled processes together

        if (this.ssao.enable) {
            this.applySSAO(source, output);
        }

        // todo: need to swap source and output?

    }

    private applySSAO(source: FrameBuffer, output: FrameBuffer) {
        const gl = GLDevice.gl;
        const sourceImage = source.getTexture(0);
        const outputImage = output.getTexture(0);
        if (sourceImage === null || outputImage === null) {
            return;
        }
        
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
        // GLTextures.setStartUnit(startTexUnit);

        // textures already bound before.
        // this._samplerUniformsSSAO.setTexture("s_sceneDepth", depthMap);
        // this._samplerUniformsSSAO.setTexture("s_sceneNormalRoughSpec", normalRoughSpec);
        gl.uniform1i(this._ssaoProgram.getUniformLocation("s_sceneDepth"), this._sceneDepthTexUnit);
        gl.uniform1i(this._ssaoProgram.getUniformLocation("s_sceneNormalRoughSpec"), this._normalRoughSpecTexUnit);

        // this._samplerUniformsSSAO.setTexture("s_noiseTex", this.ssao.noiseTexture);
        this.setTexture(this._ssaoProgram.getUniformLocation("s_noiseTex"), this._customTexStartUnit, this.ssao.noiseTexture);

        // uniforms (blocks? how many uniforms can be shared by post processes?)
        // what params ssao need?
        const texelW = 1.0 / sourceImage.width;
        const texelH = 1.0 / sourceImage.height;
        
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

        // 2. composite half res ssao and source image together?
        GLDevice.renderTarget = output;
        gl.viewport(0, 0, outputImage.width, outputImage.height);
        gl.scissor(0, 0, outputImage.width, outputImage.height);

        GLPrograms.useProgram(this._compositeSSAOProgram);

        // GLTextures.setStartUnit(startTexUnit);

        // this._samplerUniformsSSAOComposite.setTexture("s_sceneColor", sourceImage);
        // these two textures has already bound before
        // this._samplerUniformsSSAOComposite.setTexture("s_sceneDepth", depthMap);
        // this._samplerUniformsSSAOComposite.setTexture("s_sceneNormalRoughSpec", normalRoughSpec);
        this.setTexture(this._compositeSSAOProgram.getUniformLocation("s_sceneColor"), this._sceneColorTexUnit, sourceImage);
        gl.uniform1i(this._compositeSSAOProgram.getUniformLocation("s_sceneDepth"), this._sceneDepthTexUnit);
        gl.uniform1i(this._compositeSSAOProgram.getUniformLocation("s_sceneNormalRoughSpec"), this._normalRoughSpecTexUnit);
        this.setTexture(this._compositeSSAOProgram.getUniformLocation("s_aoTex"), this._customTexStartUnit, this._tempResultHalfTexture);
        // this._samplerUniformsSSAOComposite.setTexture("s_aoTex", this._tempResultHalfTexture);

        // todo: uniforms
        // uniform float u_offset;
        gl.uniform2f(this._compositeSSAOProgram.getUniformLocation("u_offset"), this.ssao.blurSize * texelW, this.ssao.blurSize * texelH);

        // uniform float u_intensity;
        gl.uniform1f(this._compositeSSAOProgram.getUniformLocation("u_intensity"), this.ssao.intensiy);

        // uniform float u_power;
        gl.uniform1f(this._compositeSSAOProgram.getUniformLocation("u_power"), this.ssao.power);

        this._rectGeom.draw(0, Infinity, this._compositeSSAOProgram.attributes);

        // don't set depth and normalroughspec to null
        GLTextures.setTextureAt(this._sceneColorTexUnit, null);
        GLTextures.setTextureAt(this._customTexStartUnit, null);
    }

    private setTexture(location: WebGLUniformLocation | null, unit: number, texture: Texture) {
        if (location !== null) {
            GLDevice.gl.uniform1i(location, unit);
            GLTextures.setTextureAt(unit, texture);
        }
    }
}
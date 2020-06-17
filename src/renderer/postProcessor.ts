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

        this._compositeSSAOProgram = new ShaderProgram();
        this._compositeSSAOProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._compositeSSAOProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["postprocess_ssao_composite_fs"]);
        this._compositeSSAOProgram.build();

        this._samplerUniformsSSAO = new SamplerUniforms(this._ssaoProgram);
        this._samplerUniformsSSAOCombine = new SamplerUniforms(this._compositeSSAOProgram);

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
        this._ssaoNoiseTexture.depth = 1;
        this._ssaoNoiseTexture.mipLevels = 1;
        this._ssaoNoiseTexture.componentType = GLDevice.gl.FLOAT;
        this._ssaoNoiseTexture.format = GLDevice.gl.RGB;
        this._ssaoNoiseTexture.samplerState = new SamplerState(GLDevice.gl.REPEAT, GLDevice.gl.REPEAT, GLDevice.gl.LINEAR, GLDevice.gl.LINEAR);

        this._ssaoNoiseTexture.create();
        const numPixels = this._ssaoNoiseTexture.width * this._ssaoNoiseTexture.height;
        const data = new Float32Array(numPixels * 3);
        // todo: try and compare different methods to generate noise texture:
        // plain random number
        for(let i = 0; i < numPixels * 3; i++) {
            data[i] = Math.random() * 2.0 - 1.0;
        }
        // simplex noise
        // blue noise?
        // rotation disk (sin and cos values)

        this._ssaoNoiseTexture.image = data;

        this._ssaoNoiseTexture.upload();

        this._ssaoKernels = new Float32Array(PostProcessor._numSSAOKernels * 3);

        this.generateSSAOKernels();

        this.ssao = new SSAOParams();
    }

    public enableSSR: boolean = true;
    public enableFXAA: boolean = true;
    public enableGlow: boolean = true;
    public enableToneMapping: boolean = true;
    // todo: other post processing effects: color grading, glow...

    public ssao: SSAOParams;

    // todo: shaders
    private static readonly _numSSAOKernels = 32;

    private _ssaoProgram: ShaderProgram;
    private _compositeSSAOProgram: ShaderProgram;
    private _samplerUniformsSSAO: SamplerUniforms;
    private _samplerUniformsSSAOCombine: SamplerUniforms;

    // todo: temp textures and framebuffers
    private _ssaoNoiseTexture: Texture2D;
    private _ssaoKernels: Float32Array;
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
        if (this.ssao.enable) {
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
        this._samplerUniformsSSAO.setTexture("s_noiseTex", this._ssaoNoiseTexture);

        // uniforms (blocks? how many uniforms can be shared by post processes?)
        // what params ssao need?
        
        // calc texel size
        gl.uniform2f(this._ssaoProgram.getUniformLocation("u_texelSize"), 1.0 / depthMap.width, 1.0 / depthMap.height);
        gl.uniform2f(this._ssaoProgram.getUniformLocation("u_noiseTexelSize"), 1.0 / this._ssaoNoiseTexture.width, 1.0 / this._ssaoNoiseTexture.height);

        // 3d sample kernels
        gl.uniform3fv(this._ssaoProgram.getUniformLocation("u_kernel"), this._ssaoKernels);

        // params
        // fix me: pack these together to a vec3? call gl api only 1 time
        gl.uniform1f(this._ssaoProgram.getUniformLocation("u_radius"), this.ssao.radius);
        gl.uniform1f(this._ssaoProgram.getUniformLocation("u_minDistance"), this.ssao.minDistance);
        gl.uniform1f(this._ssaoProgram.getUniformLocation("u_maxDistance"), this.ssao.maxDistance);

        // draw fullscr rect
        this._rectGeom.draw(0, Infinity, this._ssaoProgram.attributes);

        // 2. composite half res ssao and source image together?
        GLDevice.renderTarget = output;
        gl.viewport(0, 0, sourceImage.width, sourceImage.height);
        gl.scissor(0, 0, sourceImage.width, sourceImage.height);

        GLPrograms.useProgram(this._compositeSSAOProgram);

        GLTextures.setStartUnit(startTexUnit);

        this._samplerUniformsSSAO.setTexture("s_sceneDepth", depthMap);
        this._samplerUniformsSSAO.setTexture("s_sceneNormalRoughSpec", normalRoughSpec);
        this._samplerUniformsSSAOCombine.setTexture("s_aoTex", this._tempResultHalfTexture);

        // todo: uniforms
        // uniform float u_offset;
        // uniform float u_intensity;
        // uniform float u_power;

        this._rectGeom.draw(0, Infinity, this._compositeSSAOProgram.attributes);
    }

    private generateSSAOKernels() {
        // use random vectors in a hemisphere
        // use halton sequence?

        // https://github.com/pissang/claygl-advanced-renderer/blob/master/src/SSAOPass.js
        // NOTE: in that code they use temporal filter for SSAO, so they generate 30 kernel arrays for 30 frames.

        const offset = 0;
        let sample = new vec3();

        for(let i = 0; i < PostProcessor._numSSAOKernels; i++) {
            // let phi = Halton.get(i + offset, 2) * Math.PI;      // hemisphere
            // let theta = Halton.get(i + offset, 3) * 

            // test: use plain random values, same as three.js
            // hemisphere
            sample.x = Math.random() * 2 - 1;
            sample.y = Math.random() * 2 - 1;
            sample.z = Math.random();

            sample.normalize();

            // vary length
            let scale = i / PostProcessor._numSSAOKernels;
            scale *= scale;
            scale = 0.1 + 0.9 * scale;      // lerp(0.1, 1, scale)
            sample.scale(scale);

            this._ssaoKernels[i * 3] = sample.x;
            this._ssaoKernels[i * 3 + 1] = sample.y;
            this._ssaoKernels[i * 3 + 2] = sample.z;
        }
    }
}
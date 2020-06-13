import fullscreen_rect_vs from "./shaders/fullscreen_rect_vs.glsl.js";
import postprocess_ssao_fs from "./shaders/postprocess_ssao_fs.glsl.js";

import { Texture2D } from "../WebGLResources/textures/texture2D.js";
import { FrameBuffer } from "../WebGLResources/frameBuffer.js";
import { GLPrograms } from "../WebGLResources/glPrograms.js";
import { ShaderProgram } from "../WebGLResources/shaderProgram.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { SamplerState } from "../WebGLResources/renderStates/samplerState.js";

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

        // create shaders
        this._ssaoProgram = new ShaderProgram();
        this._ssaoProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["fullscreen_rect_vs"]);
        this._ssaoProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["postprocess_ssao_fs"]);
        this._ssaoProgram.build();

        // create temp textures and framebuffers
        this._tempResultHalf = new Texture2D();
        this._tempResultHalf.width = width / 2;
        this._tempResultHalf.height = height / 2;
        this._tempResultHalf.depth = 1;
        this._tempResultHalf.mipLevels = 1;
        this._tempResultHalf.format = GLDevice.gl.RGBA;
        this._tempResultHalf.componentType = GLDevice.gl.HALF_FLOAT;
        this._tempResultHalf.samplerState = new SamplerState(GLDevice.gl.CLAMP_TO_EDGE, GLDevice.gl.CLAMP_TO_EDGE);
        this._tempResultHalf.create();
    }

    public enableSSAO: boolean = true;
    public enableSSR: boolean = true;
    public enableFXAA: boolean = true;
    public enableGlow: boolean = true;
    public enableToneMapping: boolean = true;
    // todo: other post processing effects: color grading, glow...

    // todo: shaders
    private _ssaoProgram: ShaderProgram;

    // todo: temp textures and framebuffers
    /**
     * half res temp result image
     * can be used to store unblurred SSAO/SSR, brightpass and so on
     */
    private _tempResultHalf: Texture2D;

    public process(sourceImage: Texture2D, depthMap: Texture2D, normalGlossSpec: Texture2D, output: FrameBuffer) {
        // todo: apply all enabled processes together
        if (this.enableSSAO) {
            
        }
    }
}
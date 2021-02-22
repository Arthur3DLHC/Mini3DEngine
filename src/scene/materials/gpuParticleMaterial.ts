// shader codes
import psys_gpu_update_vs from "../../renderer/shaders/psys_gpu_update_vs.glsl.js";
import psys_gpu_update_fs from "../../renderer/shaders/psys_gpu_update_fs.glsl.js";
import psys_gpu_render_vs from "../../renderer/shaders/psys_gpu_render_vs.glsl.js";
import psys_gpu_render_fs from "../../renderer/shaders/psys_gpu_render_fs.glsl.js";
// modules
import { ShaderProgram } from "../../WebGLResources/shaderProgram.js";
import { GPUParticleSystem } from "../gpuParticleSystem.js";
import { Material } from "./material.js";
import { GLPrograms } from "../../WebGLResources/glPrograms.js";
import { ClusteredForwardRenderContext } from "../../renderer/clusteredForwardRenderContext.js";

/**
 * the default material for GPU particle systems.
 * can derive custom material classes from this class.
 */
export class GPUParticleMaterial extends Material {
    /**
     * don't call this before renderer initialized
     */
    public constructor(renderContext: ClusteredForwardRenderContext) {
        super();
        this.loadPrograms(renderContext);
    }

    public updateProgram: ShaderProgram | null = null;
    public renderProgram: ShaderProgram | null = null;
    // private static _defaultRenderStates: RenderStateSet | null = null;

    public loadPrograms(renderContext: ClusteredForwardRenderContext) {
        // load default programs
        // default feedback varyings
        const varyings: string[] = ["gl_Position",
            "ex_direction",
            // "ex_upDir",
            "ex_ageLife",
            "ex_seed",
            "ex_size",
            "ex_color",
            "ex_frameIdx",
            "ex_angle",
            // "ex_noiseTexCoord"
        ];
        this.updateProgram = new ShaderProgram();
        this.updateProgram.vertexShaderCode = GLPrograms.processSourceCode(psys_gpu_update_vs);
        this.updateProgram.fragmentShaderCode = GLPrograms.processSourceCode(psys_gpu_update_fs);
        this.updateProgram.build(varyings);

        this.renderProgram = new ShaderProgram();
        this.renderProgram.vertexShaderCode = GLPrograms.processSourceCode(psys_gpu_render_vs);
        this.renderProgram.fragmentShaderCode = GLPrograms.processSourceCode(psys_gpu_render_fs);
        this.renderProgram.build();

        // bind uniform buffer objects: perscene, perview, perobject
        // for render program only?
        renderContext.bindUniformBlocks(this.updateProgram);
        renderContext.bindUniformBlocks(this.renderProgram);

        // subclasses can override this method to load their own programs
    }

    // uniform values?
    // not using uniform buffer object?

    // textures?

    // set uniform values for update program?
    public setUpdateProgramUniforms(psys: GPUParticleSystem) {
        // get properties form psys, set them to uniforms
    }

    // set uniform values for render program?
    public setRenderProgramUniforms(psys: GPUParticleSystem) {
        // get properties form psys, set them to uniforms
    }
}
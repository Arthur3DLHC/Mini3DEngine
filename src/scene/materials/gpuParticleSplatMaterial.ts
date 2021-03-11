// shader codes
import function_particle_lighting from "../../renderer/shaders/shaderIncludes/function_particle_lighting.glsl.js";
import psys_gpu_update_vs from "../../renderer/shaders/psys_gpu_update_vs.glsl.js";
import psys_gpu_update_fs from "../../renderer/shaders/psys_gpu_update_fs.glsl.js";
import psys_gpu_render_vs from "../../renderer/shaders/psys_gpu_render_vs.glsl.js";
import psys_gpu_render_fs_splat from "../../renderer/shaders/psys_gpu_render_fs_splat.glsl.js";
// modules
import { ClusteredForwardRenderContext } from "../../renderer/clusteredForwardRenderContext.js";
import { GPUParticleMaterial } from "./gpuParticleMaterial.js";
import { GLPrograms } from "../../WebGLResources/glPrograms.js";
import { ShaderProgram } from "../../WebGLResources/shaderProgram.js";

export class GPUParticleSplatMaterial extends GPUParticleMaterial {
    public constructor(renderContext: ClusteredForwardRenderContext) {
        super(renderContext);
    }

    public loadPrograms(renderContext: ClusteredForwardRenderContext) {
        if (GLPrograms.shaderCodes["function_particle_lighting"] === undefined) GLPrograms.shaderCodes["function_particle_lighting"] = function_particle_lighting;

        this.updateProgram = new ShaderProgram();
        this.updateProgram.vertexShaderCode = GLPrograms.processSourceCode(psys_gpu_update_vs);
        this.updateProgram.fragmentShaderCode = GLPrograms.processSourceCode(psys_gpu_update_fs);
        this.updateProgram.build(GPUParticleMaterial.varyings);

        this.renderProgram = new ShaderProgram();
        this.renderProgram.vertexShaderCode = GLPrograms.processSourceCode(psys_gpu_render_vs);
        this.renderProgram.fragmentShaderCode = GLPrograms.processSourceCode(psys_gpu_render_fs_splat);
        this.renderProgram.build();

        // bind uniform buffer objects: perscene, perview, perobject
        // for render program only?
        renderContext.bindUniformBlocks(this.updateProgram);
        renderContext.bindUniformBlocks(this.renderProgram);
    }
}
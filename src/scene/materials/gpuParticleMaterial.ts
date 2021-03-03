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
import { Texture2D } from "../../WebGLResources/textures/texture2D.js";
import { GLDevice } from "../../WebGLResources/glDevice.js";
import { GLTextures } from "../../WebGLResources/glTextures.js";
import vec2 from "../../../lib/tsm/vec2.js";

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
        const varyings: string[] = ["ex_position",
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
    // texture with animation frames, in one row
    public texture: Texture2D | null = null;

    /**
     * num column and rows in texture animation sheet
     * for calc texcoords when rendering 
     */
    public texAnimSheetSize: vec2 = new vec2([1,1]);

    // set uniform values for update program?
    public setUpdateProgramUniforms(psys: GPUParticleSystem, startTexUnit: number) {
        // get properties from psys, set them to uniforms
    }

    // set uniform values for render program?
    public setRenderProgramUniforms(psys: GPUParticleSystem, startTexUnit: number) {
        if (this.renderProgram === null) {
            return;
        }
        const gl = GLDevice.gl;
        // get properties from psys, set them to uniforms

        // set texture and sampler; fix me: use witch sampler?
        let texUnit = startTexUnit;
        if (this.texture !== null) {
            GLTextures.setTextureAt(texUnit, this.texture);
            gl.uniform1i(this.renderProgram.getUniformLocation("s_texture"), texUnit);
            const uScale = 1.0 / this.texAnimSheetSize.x;
            const vScale = 1.0 / this.texAnimSheetSize.y;
            gl.uniform3f(this.renderProgram.getUniformLocation("u_texAnimSheetInfo"), uScale, vScale, this.texAnimSheetSize.x - 1);

            // texUnit++;
        } else {
            gl.uniform3f(this.renderProgram.getUniformLocation("u_texAnimSheetInfo"), 0, 0, 0);
        }
    }
}
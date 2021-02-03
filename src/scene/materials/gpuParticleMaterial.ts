import { ShaderProgram } from "../../WebGLResources/shaderProgram.js";
import { GPUParticleSystem } from "../gpuParticleSystem.js";
import { Material } from "./material.js";

/**
 * the default material for GPU particle systems.
 * can derive custom material classes from this class.
 */
export class GPUParticleMaterial extends Material {
    public constructor() {
        super();
        this.loadPrograms();
    }

    public updateProgram: ShaderProgram | null = null;
    public renderProgram: ShaderProgram | null = null;
    // private static _defaultRenderStates: RenderStateSet | null = null;

    public loadPrograms() {
        // load default programs
        // subclasses can override this method to load their own programs
    }

    // uniform values?
    // not using uniform buffer object?

    // set uniform values for update program?
    public setUpdateProgramUniforms(psys: GPUParticleSystem) {
        // get properties form psys, set them to uniforms
    }

    // set uniform values for render program?
    public setRenderProgramUniforms(psys: GPUParticleSystem) {
        // get properties form psys, set them to uniforms
    }
}
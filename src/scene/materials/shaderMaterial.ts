import { Material } from "./material.js";
import { ShaderProgram } from "../../WebGLResources/shaderProgram.js";

/**
 * Material uses a custom shader program.
 */
export class ShaderMaterial extends Material {
    public constructor() {
        super();
        this.program = null;
    }
    public program: ShaderProgram | null;
}
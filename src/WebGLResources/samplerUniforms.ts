import { ShaderProgram } from "./shaderProgram.js";
import { Texture } from "./textures/texture.js";

export class SamplerUniforms {
    public constructor(program: ShaderProgram) {
        // get active uniforms of sampler types, record their locations
    }

    public setTexture(uniformName: string, texture: Texture) {

    }

    public setTextureUnit(uniformName: string, unit:  number) {

    }
}
import { ShaderProgram } from "./shaderProgram.js";
import { Texture } from "./textures/texture.js";
import { GLDevice } from "./glDevice.js";
import { GLPrograms } from "./glPrograms.js";
import { GLTextures } from "./glTextures.js";

export class SamplerUniforms {
    public constructor(program: ShaderProgram) {
        // get active uniforms of sampler types, record their locations
        if (!program.glProgram) {
            throw new Error("Program not built yet");
        }
        this._uniformLocations = {};
        this._uniformInfos = {};
        const count = GLDevice.gl.getProgramParameter(program.glProgram, GLDevice.gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < count; i++) {
            const info = GLDevice.gl.getActiveUniform(program.glProgram, i);
            if (info) {
                if (info.type === GLDevice.gl.SAMPLER_2D
                    || info.type === GLDevice.gl.SAMPLER_3D
                    || info.type === GLDevice.gl.SAMPLER_CUBE
                    || info.type === GLDevice.gl.SAMPLER_2D_SHADOW
                    || info.type === GLDevice.gl.SAMPLER_2D_ARRAY
                    || info.type === GLDevice.gl.SAMPLER_2D_ARRAY_SHADOW
                    || info.type === GLDevice.gl.SAMPLER_CUBE_SHADOW ) {
                        const location = GLDevice.gl.getUniformLocation(program.glProgram, info.name);
                        if (location) {
                            this._uniformInfos[info.name] = info;
                            this._uniformLocations[info.name] = location;
                        }
                }
                // uniforms of other type will be in uniform blocks and updated using uniform buffer objects
            }
        }
    }

    public setTexture(uniformName: string, texture: Texture) {
        if (this._uniformLocations[uniformName]) {
            // check texture type? necessary?
            const info = this._uniformInfos[uniformName];
            if (info) {
                if (info.type !== texture.samplerType) {
                    throw new Error("Sampler type mismatch: " + uniformName);
                }
            }

            // query a new texture unit
            const unit = GLTextures.queryUnit();
            GLTextures.setTextureAt(unit, texture);
            GLDevice.gl.uniform1i(this._uniformLocations[uniformName], unit);
        } else {
            // throw or log error?
            throw new Error("active uniform not found: " + uniformName);
        }
    }

    public setTextureUnit(uniformName: string, unit: number) {
        if (this._uniformLocations[uniformName]) {
            GLDevice.gl.uniform1i(this._uniformLocations[uniformName], unit);
        }
    }

    private _uniformInfos: {[key:string]: WebGLActiveInfo};
    private _uniformLocations: {[key: string]: WebGLUniformLocation};
}
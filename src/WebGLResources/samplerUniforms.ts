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
        const gl = GLDevice.gl;
        this._uniformLocations = {};
        this._uniformInfos = {};
        const count = gl.getProgramParameter(program.glProgram, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < count; i++) {
            const info = gl.getActiveUniform(program.glProgram, i);
            if (info) {
                if (info.type === gl.SAMPLER_2D
                    || info.type === gl.SAMPLER_3D
                    || info.type === gl.SAMPLER_CUBE
                    || info.type === gl.SAMPLER_2D_SHADOW
                    || info.type === gl.SAMPLER_2D_ARRAY
                    || info.type === gl.SAMPLER_2D_ARRAY_SHADOW
                    || info.type === gl.SAMPLER_CUBE_SHADOW ) {
                        const location = gl.getUniformLocation(program.glProgram, info.name);
                        if (location !== null) {
                            this._uniformInfos[info.name] = info;
                            this._uniformLocations[info.name] = location;
                        }
                }
                // uniforms of other type will be in uniform blocks and updated using uniform buffer objects
            }
        }
    }

    public setTexture(uniformName: string, texture: Texture | null) {
        if (this._uniformLocations[uniformName]) {
            if (texture) {
                // check texture type? necessary?
                const info = this._uniformInfos[uniformName];
                if (info) {
                    if (info.type !== texture.samplerType) {
                        throw new Error("Sampler type mismatch: " + uniformName);
                    }
                }
            }
            // query a new texture unit
            const unit = GLTextures.queryUnit();
            GLTextures.setTextureAt(unit, texture);
            GLDevice.gl.uniform1i(this._uniformLocations[uniformName], unit);
        } else {
            // uniform not found or not active
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
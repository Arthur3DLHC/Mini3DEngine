import { ShaderProgram } from "./shaderProgram.js";
import { Texture } from "./textures/texture.js";
import { GLDevice } from "./glDevice.js";
import { GLPrograms } from "./glPrograms.js";

export class SamplerUniforms {
    public constructor(program: ShaderProgram) {
        // get active uniforms of sampler types, record their locations
        if (!program.glProgram) {
            throw new Error("Program not built yet");
        }
        this._uniformLocations = {};
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
                            this._uniformLocations[info.name] = location;
                        }
                }
            }
        }
    }

    public setTexture(uniformName: string, texture: Texture) {

    }

    public setTextureUnit(uniformName: string, unit:  number) {

    }

    private _uniformLocations: {[key: string]: WebGLUniformLocation};
}
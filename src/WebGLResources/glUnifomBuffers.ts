import { UniformBuffer } from "./uniformBuffer.js";
import { GLDevice } from "./glDevice.js";
import { ShaderProgram } from "./shaderProgram.js";

export class GLUniformBuffers {
    // TODO: 给 shaderProgram 中的 uniformBlock 分配绑定索引的方法
    public static uniformBlockNames: {[key:string]: number} = {};
    private static _uniformBlockSizes: {[key:string]: number} = {};
    private static _uniformBuffers: {[key:string]: UniformBuffer|null} = {};

    /**
     * 
     * @param buffer 当前要使用的 uniform buffer
     * @param uniformBlockName 
     */
    public static bindUniformBuffer(buffer: UniformBuffer | null, uniformBlockName: string) {
        if (GLUniformBuffers.uniformBlockNames[uniformBlockName] === undefined) {
            throw new Error("Uniform block binding point not assigned: " + uniformBlockName);
        }

        if (buffer) {
            if (!buffer.glBuffer) {
                buffer.build();
            }
            console.log("bind uniform buffer: [" + uniformBlockName + "] size: " + buffer.byteLength + " to " + GLUniformBuffers.uniformBlockNames[uniformBlockName]);
            GLDevice.gl.bindBufferBase(GLDevice.gl.UNIFORM_BUFFER, GLUniformBuffers.uniformBlockNames[uniformBlockName], buffer.glBuffer);
        } else {
            GLDevice.gl.bindBufferBase(GLDevice.gl.UNIFORM_BUFFER, GLUniformBuffers.uniformBlockNames[uniformBlockName], null);
        }
        this._uniformBuffers[uniformBlockName] = buffer;
    }

    public static bindUniformBlock(program: ShaderProgram, blockName: string) {
        if (GLUniformBuffers.uniformBlockNames[blockName] === undefined) {
            throw new Error("Uniform block binding point not assigned: " + blockName);
        }
        if (!program.glProgram) {
            program.build();
        }
        if (program.glProgram) {
            const location = GLDevice.gl.getUniformBlockIndex(program.glProgram, blockName);
            const size = GLDevice.gl.getActiveUniformBlockParameter(program.glProgram, location, GLDevice.gl.UNIFORM_BLOCK_DATA_SIZE);
            console.log("Binding uniform block [" + blockName + "] (location: " + location + " size: " + size + ") to " + GLUniformBuffers.uniformBlockNames[blockName]);
            GLDevice.gl.uniformBlockBinding(program.glProgram, location, GLUniformBuffers.uniformBlockNames[blockName]);
            // GLUniformBuffers._uniformBlockNames[blockName] = index;
            this._uniformBlockSizes[blockName] = size;
        }
    }

    public static checkSizeMatch() {

    }
}
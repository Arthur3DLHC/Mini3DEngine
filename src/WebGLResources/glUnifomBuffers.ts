import { UniformBuffer } from "./uniformBuffer.js";
import { GLDevice } from "./glDevice.js";
import { ShaderProgram } from "./shaderProgram.js";

export class GLUniformBuffers {
    // TODO: 给 shaderProgram 中的 uniformBlock 分配绑定索引的方法
    public static uniformBlockNames: {[key:string]: number} = {};

    /**
     * 
     * @param buffer 当前要使用的 uniform buffer
     * @param unifomBlockName 
     */
    public static bindUniformBuffer(buffer: UniformBuffer | null, unifomBlockName: string) {
        if (GLUniformBuffers.uniformBlockNames[unifomBlockName] === undefined) {
            throw new Error("Uniform block binding point not assigned: " + unifomBlockName);
        }

        if (buffer) {
            if (!buffer.glBuffer) {
                buffer.build();
            }
            GLDevice.gl.bindBufferBase(GLDevice.gl.UNIFORM_BUFFER, GLUniformBuffers.uniformBlockNames[unifomBlockName], buffer.glBuffer);
        } else {
            GLDevice.gl.bindBufferBase(GLDevice.gl.UNIFORM_BUFFER, GLUniformBuffers.uniformBlockNames[unifomBlockName], null);
        }
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
            try{
                GLDevice.gl.uniformBlockBinding(program.glProgram, location, GLUniformBuffers.uniformBlockNames[blockName]);
            } catch (e) {
                console.error(e);
            }
            // GLUniformBuffers._uniformBlockNames[blockName] = index;
        }
    }
}
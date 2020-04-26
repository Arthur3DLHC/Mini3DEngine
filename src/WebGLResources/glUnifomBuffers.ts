import { UniformBuffer } from "./uniformBuffer.js";
import { GLDevice } from "./glDevice.js";
import { ShaderProgram } from "./shaderProgram.js";

export class GLUniformBuffers {
    // TODO: 给 shaderProgram 中的 uniformBlock 分配绑定索引的方法
    private static _uniformBlockNames: {[key:string]: number} = {};

    /**
     * 
     * @param buffer 当前要使用的 uniform buffer
     * @param unifomBlockName 
     */
    public static bindUniformBuffer(buffer: UniformBuffer | null, unifomBlockName: string) {
        GLDevice.gl.bindBufferBase(GLDevice.gl.UNIFORM_BUFFER, GLUniformBuffers._uniformBlockNames[unifomBlockName], buffer);
    }

    public static bindUniformBlock(program: ShaderProgram, blockName: string, index: number) {
        if (!program.glProgram) {
            program.build();
        }
        if (program.glProgram) {
            const location = GLDevice.gl.getUniformBlockIndex(program.glProgram, blockName);
            GLDevice.gl.uniformBlockBinding(program.glProgram, location, index);
        }
    }
}
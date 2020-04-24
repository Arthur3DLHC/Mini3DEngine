import { UniformBuffer } from "./uniformBuffer.js";

export class GLUniformBuffers {
    // TODO: 给 shaderProgram 中的 uniformBlock 分配绑定索引的方法
    private _uniformBlockNames: {[key:string]: number} = {};
    
    // TODO: 绑定要使用的 Uniform Buffer 的方法
    public static bindUniformBuffer(buffer: UniformBuffer | null, unifomBlockName: string) {
        throw new Error("Not implemented");
    }
}
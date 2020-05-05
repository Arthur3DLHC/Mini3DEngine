import { ShaderProgram } from "./shaderProgram.js";
import { GLDevice } from "./glDevice.js";

/**
 * GL program manager and helper
 */
export class GLPrograms {
    public constructor() {

    }

    /**
     * 所有可用的 shader 代码段集合
     * 系统启动时，需要将自己要使用的所有 shader 代码段添加到此集合中
     * 每个 shader 代码段需要用唯一名称字符串Key
     * 在 shader 代码中 #include 其他文件时，需要使用该文件的Key，形式如下：
     * #include <shader代码key>
     */
    public static shaderCodes: {[key:string]: string} = {};

    private static includePattern = /^[ \t]*#include +<([\w\d./]+)>/gm;

    private static _currProgram: ShaderProgram|null = null;

    public static get currProgram(): ShaderProgram | null {
        return GLPrograms.currProgram;
    }

    public static processSourceCode(code: string): string {
        // #include
        let result = GLPrograms.resolveInclude(code);
        
        // 其他还需要那些预处理？
        // version and precision
        const header = `
        #version 300 es
        precision highp float;
        precision highp int;
        `;
        result = header + result;
        return result;
    }

    /**
     * 处理代码中的 include
     * @param code 代码内容字符串
     * @param includedCodes 已经引用过的代码段key的列表
     */
    private static resolveInclude(code: string): string {
        // 用正则表达式查找 #include，并解析出要引用的代码段key
        // 根据 key 获得代码段，递归调用 resolveInclude
        // 用递归得到的字符串替换 #include 行；
        // 注意处理重复引用的情况；记录一下已经引用过的代码段key？
        // 或者不允许重复引用？在被引用代码段里不能再加 #include

        return code.replace(GLPrograms.includePattern, (match: string, shaderKey: string): string => {
            let code = GLPrograms.shaderCodes[shaderKey];
            if (!code) {
                throw new Error("Can not resolve #include <" + shaderKey + ">");
            }
            return this.resolveInclude(code);
        });
    }

    public static useProgram(program: ShaderProgram) {
        if (GLPrograms._currProgram !== program) {
            if (!program.glProgram) {
                // program 的代码应该在加载时就已经处理好
                program.build();
            }
            if (program.glProgram) {
                GLDevice.gl.useProgram(program.glProgram);
            }
            GLPrograms._currProgram = program;
        }
    }
}
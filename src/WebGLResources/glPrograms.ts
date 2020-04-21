import { ShaderProgram } from "./shaderProgram.js";

/**
 * GL program manager and helper
 */
export class GLPrograms {
    public constructor() {

    }

    public static processSourceCode(code: string): string {
        // resolve includes recursively
        throw new Error("Not implemented.");
    }

    // fix me: put build method here, or put it in shaderprogram class?
    public static buildProgramFromSourceCode(vsCode: string, fsCode: string): ShaderProgram {
        throw new Error("Not implemented.");
    }
}
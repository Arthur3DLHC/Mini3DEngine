import { ShaderProgram } from "./shaderProgram.js";
import { GLDevice } from "./glDevice.js";

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

    public static useProgram(program: ShaderProgram) {
        if (!program.glProgram) {
            program.build();
        }
        if (program.glProgram) {
            GLDevice.gl.useProgram(program.glProgram);
        }
    }
}
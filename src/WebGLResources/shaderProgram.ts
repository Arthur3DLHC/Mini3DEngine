import { GLDevice } from "./glDevice.js";

export class ShaderProgram {
    public constructor() {
        this.name = "";
        this.glProgram = null;
        this.vertexShaderCode = "";
        this.fragmentShaderCode = "";
    }

    public name: string;

    public glProgram: WebGLProgram | null;

    public vertexShaderCode: string;
    public fragmentShaderCode: string;

    public build() {
        if (this.vertexShaderCode === "" || this.fragmentShaderCode === "") {
            throw new Error("Shader code is empty");
        }

        if (this.glProgram) {
            throw new Error("Already built.");
        }

        // Fix me: 在哪预处理shader代码？替换 #include 等
        const vs = this.compile(this.vertexShaderCode, GLDevice.gl.VERTEX_SHADER);
        const fs = this.compile(this.fragmentShaderCode, GLDevice.gl.FRAGMENT_SHADER);

        if (!vs || !fs) {
            throw new Error("Faild building shader: " + this.name);
        }

        this.glProgram = GLDevice.gl.createProgram();
        if (!this.glProgram) {
            throw new Error("Faild creating gl program");
        }
        GLDevice.gl.attachShader(this.glProgram, vs);
        GLDevice.gl.attachShader(this.glProgram, fs);
        // 此时先不绑定 attribute location
        GLDevice.gl.linkProgram(this.glProgram);
        let linkLog = GLDevice.gl.getProgramInfoLog(this.glProgram);
        if (linkLog) {
            if (linkLog.length > 0) {
                throw linkLog;
            }
        }
    }

    public release() {
        if (this.glProgram) {
            GLDevice.gl.deleteProgram(this.glProgram);
            this.glProgram = null;
        }
    }

    // todo: get attributes

    private compile(code: string, type: GLenum): WebGLShader | null {
        const shader = GLDevice.gl.createShader(type);
        if (shader) {
            GLDevice.gl.shaderSource(shader, code);
            GLDevice.gl.compileShader(shader);
            let compileLog = GLDevice.gl.getShaderInfoLog(shader);
            if (compileLog) {
                if (compileLog.length > 0) {
                    throw compileLog;
                }
            }
        } else {
            throw new Error("Failed creating gl shader object");
        }
        return shader;
    }
}
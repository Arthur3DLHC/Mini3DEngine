import { GLDevice } from "./glDevice.js";

export class ShaderProgram {
    public constructor() {
        this.name = "";
        this.glProgram = null;
        this.vertexShaderCode = "";
        this.fragmentShaderCode = "";
        this._attributes = null;
    }

    public name: string;

    public glProgram: WebGLProgram | null;

    public vertexShaderCode: string;
    public fragmentShaderCode: string;

    private _attributes: Map<string, number>|null;

    public build() {
        if (this.vertexShaderCode === "" || this.fragmentShaderCode === "") {
            throw new Error("Shader code is empty");
        }

        if (this.glProgram) {
            throw new Error("Already built. call release first.");
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
                throw this.name + ":" + linkLog;
            }
        }
        // clean up
        GLDevice.gl.deleteShader(vs);
        GLDevice.gl.deleteShader(fs);
    }

    public release() {
        if (this.glProgram) {
            GLDevice.gl.deleteProgram(this.glProgram);
            this.glProgram = null;
        }
        this._attributes = null;
    }

    public get attributes(): Map<string, number> {
        if (!this.glProgram) {
            throw new Error("program not build yet.");
        }
        if (!this._attributes) {
            this._attributes = new Map<string, number>();
            const numAttrs = GLDevice.gl.getProgramParameter(this.glProgram, GLDevice.gl.ACTIVE_ATTRIBUTES);
            for(let i = 0; i < numAttrs; i++) {
                const info = GLDevice.gl.getActiveAttrib(this.glProgram, i);
                if (info) {
                    const name = info.name;
                    this._attributes.set(name, GLDevice.gl.getAttribLocation(this.glProgram, name));
                }
            }
        }
        return this._attributes;
    }

    // todo: cache the uniform locations to prevent low level gl call? Is that necessary?
    public getUniformLocation(name: string): WebGLUniformLocation | null {
        if (this.glProgram === null) {
            return null;
        }
        return GLDevice.gl.getUniformLocation(this.glProgram, name);
    }

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
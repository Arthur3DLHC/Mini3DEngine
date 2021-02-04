import { GLDevice } from "./glDevice.js";

export class ShaderProgram {
    public constructor() {
        this.name = "";
        this.glProgram = null;
        this.vertexShaderCode = "";
        this.fragmentShaderCode = "";
        this._attributes = null;
        this._uniformLocations = new Map<string, WebGLUniformLocation>();
    }

    public name: string;

    public glProgram: WebGLProgram | null;

    public vertexShaderCode: string;
    public fragmentShaderCode: string;

    private _attributes: Map<string, number>|null;
    private _uniformLocations: Map<string, WebGLUniformLocation>;

    public build(transformFeedbackVaryings?: string[]) {
        if (this.vertexShaderCode === "" || this.fragmentShaderCode === "") {
            throw new Error("Shader code is empty");
        }

        if (this.glProgram) {
            throw new Error("Already built. call release first.");
        }

        const gl = GLDevice.gl;

        // Fix me: 在哪预处理shader代码？替换 #include 等
        const vs = this.compile(this.vertexShaderCode, gl.VERTEX_SHADER);
        const fs = this.compile(this.fragmentShaderCode, gl.FRAGMENT_SHADER);

        if (!vs || !fs) {
            throw new Error("Faild building shader: " + this.name);
        }

        this.glProgram = gl.createProgram();
        if (!this.glProgram) {
            throw new Error("Faild creating gl program");
        }
        gl.attachShader(this.glProgram, vs);
        gl.attachShader(this.glProgram, fs);

        // do not bind attribute locations now

        // is this a transform feedback program?
        if (transformFeedbackVaryings !== undefined && transformFeedbackVaryings.length > 0) {
            gl.transformFeedbackVaryings(this.glProgram, transformFeedbackVaryings, gl.INTERLEAVED_ATTRIBS);
        }

        gl.linkProgram(this.glProgram);
        let linkLog = gl.getProgramInfoLog(this.glProgram);
        if (linkLog) {
            if (linkLog.length > 0) {
                console.warn(this.name + " " + linkLog);
            }
        }
        if(!gl.getProgramParameter(this.glProgram, gl.LINK_STATUS)) {
            throw "failed linking program: " + this.name;
        }

        // todo: cache uniform locations?

        // clean up
        gl.deleteShader(vs);
        gl.deleteShader(fs);
    }

    public release() {
        if (this.glProgram) {
            GLDevice.gl.deleteProgram(this.glProgram);
            this.glProgram = null;
        }
        this._attributes = null;
        this._uniformLocations.clear();
    }

    public get attributes(): Map<string, number> {
        if (!this.glProgram) {
            throw new Error("program not build yet.");
        }
        if (!this._attributes) {
            this._attributes = new Map<string, number>();
            const gl = GLDevice.gl;
            const numAttrs = gl.getProgramParameter(this.glProgram, gl.ACTIVE_ATTRIBUTES);
            for(let i = 0; i < numAttrs; i++) {
                const info = gl.getActiveAttrib(this.glProgram, i);
                if (info) {
                    const name = info.name;
                    this._attributes.set(name, gl.getAttribLocation(this.glProgram, name));
                }
            }
        }
        return this._attributes;
    }

    public getUniformLocation(name: string): WebGLUniformLocation | null {
        if (this.glProgram === null) {
            return null;
        }
        // find in cache
        let location = this._uniformLocations.get(name); 
        if ( location !== undefined) {
            return location;
        }

        // not found, get from gl
        let ret = GLDevice.gl.getUniformLocation(this.glProgram, name);
        if (ret !== null) {
            this._uniformLocations.set(name, ret);
        }
        return ret;
    }

    private compile(code: string, type: GLenum): WebGLShader | null {
        const gl = GLDevice.gl;
        const shader = gl.createShader(type);
        if (shader) {
            gl.shaderSource(shader, code);
            gl.compileShader(shader);
            let compileLog = gl.getShaderInfoLog(shader);
            if (compileLog) {
                if (compileLog.length > 0) {
                    console.warn(this.name + " :\n" + code + "\nerror: " + compileLog);
                    // throw compileLog;
                }
            }
            if( ! gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw this.name + " :\n" + code + "\nerror: " + compileLog;
            }
        } else {
            throw new Error("Failed creating gl shader object");
        }
        return shader;
    }
}
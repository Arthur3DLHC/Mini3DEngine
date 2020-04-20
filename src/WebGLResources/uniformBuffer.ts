import { vec2, vec3, vec4, mat2, mat3, mat4 } from "gl-matrix";
import { BufferSegment } from "./bufferSegment.js";
import { GLDevice } from "./glDevice.js";

export class UniformBuffer {
    public constructor(dynamic: boolean = true) {
        this.bufferData = null;
        this.bufferGL = null;
        this._uniforms = {};
        this._dynamic = dynamic;
    }
    public bufferData: Float32Array | null;
    public bufferGL: WebGLBuffer | null;

    private _dynamic: boolean;
    private _uniforms: {[key: string]: BufferSegment};

    // todo: method for add/set/remove named uniform variables
    public addUniform(name: string, numFloats: number) {
        if (this._uniforms[name] !== undefined) {
            throw new Error("Uniform" + name + "already exist.");
        }
        // 注意：需要保证布局匹配添加顺序
        throw new Error("Not implemented");
    }

    public addFloat(name: string, val: number) {
        throw new Error("Not implemented");
    }

    public addVec2(name: string, val: vec2) {
        throw new Error("Not implemented");
    }

    public addVec3(name: string, val: vec3) {
        throw new Error("Not implemented");
    }

    public addVec4(name: string, val: vec4) {
        throw new Error("Not implemented");
    }

    public addMat2(name: string, val: mat2) {
        throw new Error("Not implemented");
    }

    public addMat3(name: string, val: mat3) {
        throw new Error("Not implemented");
    }

    public addMat4(name: string, val: mat4) {
        throw new Error("Not implemented");
    }

    public setFloat(name: string, val: number) {
        throw new Error("Not implemented");
    }

    public setVec2(name: string, val: vec2) {
        throw new Error("Not implemented");
    }

    public setVec3(name: string, val: vec3) {
        throw new Error("Not implemented");
    }

    public setVec4(name: string, val: vec4) {
        throw new Error("Not implemented");
    }

    public setMat2(name: string, val: mat2) {
        throw new Error("Not implemented");
    }

    public setMat3(name: string, val: mat3) {
        throw new Error("Not implemented");
    }

    public setMat4(name: string, val: mat4) {
        throw new Error("Not implemented");
    }

    public build() {
        if (!this.bufferData) {
            return;
        }

        // 用当前 buffer 数据创建glUniformBuffer对象
        this.bufferGL = GLDevice.gl.createBuffer();
        GLDevice.gl.bindBuffer(GLDevice.gl.UNIFORM_BUFFER, this.bufferGL);
        if (this._dynamic) {
            GLDevice.gl.bufferData(GLDevice.gl.UNIFORM_BUFFER, this.bufferData, GLDevice.gl.DYNAMIC_DRAW);
        } else {
            GLDevice.gl.bufferData(GLDevice.gl.UNIFORM_BUFFER, this.bufferData, GLDevice.gl.STATIC_DRAW);
        }
        GLDevice.gl.bindBuffer(GLDevice.gl.UNIFORM_BUFFER, null);
    }

    public update() {
        throw new Error("Not implemented");
    }
}
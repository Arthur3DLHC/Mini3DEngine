import { vec2, vec3, vec4, mat2, mat3, mat4 } from "gl-matrix";

export class UniformBuffer {
    public constructor() {
        this.bufferData = null;
        this.bufferGL = null;
    }
    public bufferData: Float32Array | null;
    public bufferGL: WebGLBuffer | null;

    // todo: method for add/set/remove named uniform variables
    public addUniform(name: string, numFloats: number) {
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
        // build bufferData and offsets according to uniform variables
        // 注意按 float4 对齐
        throw new Error("Not implemented");
    }

    public update() {
        throw new Error("Not implemented");
    }
}
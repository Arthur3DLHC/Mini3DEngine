import { vec2, vec3, vec4, mat2, mat3, mat4 } from "gl-matrix";
import { BufferSegment } from "./bufferSegment.js";
import { GLDevice } from "./glDevice.js";

export class UniformBuffer {
    public constructor(dynamic: boolean = true) {
        this._data = [];
        this._bufferData = null;
        this.bufferGL = null;
        this._uniforms = {};
        this._dynamic = dynamic;
        this._currStartIdx = 0;
    }
    public bufferGL: WebGLBuffer | null;

    private _dynamic: boolean;
    private _uniforms: {[key: string]: BufferSegment};
    private _currStartIdx: number;
    private _bufferData: Float32Array | null;
    private _data: number[];

    // todo: method for add/set/remove named uniform variables
    public addUniform(name: string, numFloats: number) {
        if (this._uniforms[name] !== undefined) {
            throw new Error("Uniform" + name + "already exist.");
        }
        // 注意：需要保证布局匹配添加顺序
        // 注意：std140 对齐
        // 注意是先对齐；对齐的意义，例如：
        // 如果已经往Buffer里放了一个float3:          x y z
        // 那么下一个如果放 float，是可以继续的：      x y z x
        // 但如果要放vec2，则放不下了，需要对齐：      x y z 0 | x y
        // 所以是先检查对齐，再添加。
        // 另外目前只使用了浮点数的uniform，没考虑其它类型。
        this.alignUniform(numFloats);
        const unifom: BufferSegment = new BufferSegment();
        unifom.start = this._currStartIdx;
        unifom.count = numFloats;
        this._uniforms[name] = unifom;
        this._currStartIdx += numFloats;
        for (let i = 0; i < numFloats; i++) {
            this._data.push(0);            
        }
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
        if (!this._bufferData) {
            return;
        }

        // 用当前 buffer 数据创建glUniformBuffer对象
        this.bufferGL = GLDevice.gl.createBuffer();
        GLDevice.gl.bindBuffer(GLDevice.gl.UNIFORM_BUFFER, this.bufferGL);
        if (this._dynamic) {
            GLDevice.gl.bufferData(GLDevice.gl.UNIFORM_BUFFER, this._bufferData, GLDevice.gl.DYNAMIC_DRAW);
        } else {
            GLDevice.gl.bufferData(GLDevice.gl.UNIFORM_BUFFER, this._bufferData, GLDevice.gl.STATIC_DRAW);
        }
        GLDevice.gl.bindBuffer(GLDevice.gl.UNIFORM_BUFFER, null);
    }

    public update() {
        throw new Error("Not implemented");
    }

    private alignUniform(size: number) {
        let alignment = 0;
        if (size <= 2) {
            alignment = size;
        } else {
            alignment = 4;
        }

        if ((this._currStartIdx % alignment) !== 0) {
            var oldPointer = this._currStartIdx;
            this._currStartIdx += alignment - (this._currStartIdx % alignment);
            var diff = this._currStartIdx - oldPointer;

            for (let i = 0; i < diff; i++) {
                this._data.push(0);
            }
        }
    }
}
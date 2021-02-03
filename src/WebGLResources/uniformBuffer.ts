import { BufferSegment } from "./bufferSegment.js";
import { GLDevice } from "./glDevice.js";
import vec2 from "../../lib/tsm/vec2.js";
import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";
import mat2 from "../../lib/tsm/mat2.js";
import mat4 from "../../lib/tsm/mat4.js";
import mat3 from "../../lib/tsm/mat3.js";

/**
 * note: only support floating point type (float, vec2, vec3, vec4, mat2, mat3, mat4) uniforms now
 */
export class UniformBuffer {
    /**
     * 构造函数
     * @param dynamic 是否是动态 uniformbuffer。默认值 true
     */
    public constructor(name: string, dynamic: boolean = true) {
        this.name = name;
        this._data = [];
        this._bufferData = null;
        this.glBuffer = null;
        this._uniforms = {};
        this._dynamic = dynamic;
        this._currStartIdx = 0;
    }
    public name: string;
    public glBuffer: WebGLBuffer | null;

    public get byteLength(): number {
        if (this._bufferData) {
            return this._bufferData.byteLength;
        }
        return 0;
    }

    private _dynamic: boolean;
    private _uniforms: {[key: string]: BufferSegment};
    private _currStartIdx: number;
    private _bufferData: Float32Array | null;
    private _data: number[];
    private static _tmpBuffer: Float32Array = new Float32Array(256);    // 每次拷贝数据时不用重新 new 了
    
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

    // todo: method for add/set/remove named uniform variables
    public addUniform(name: string, numFloats: number, data?: number[]) {
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
        if (data) {
            for (let i = 0; i< numFloats && i < data.length; i++) {
                this._data.push(data[i]);
            }
        } else {
            for (let i = 0; i < numFloats; i++) {
                this._data.push(0);            
            } 
        }
    }

    public addFloat(name: string, val: number) {
        const data = [val];
        this.addUniform(name, 1, data);
    }

    public addVec2(name: string, val: vec2) {
        const data = [val.x, val.y];
        this.addUniform(name, 2, data);
    }

    public addVec3(name: string, val: vec3) {
        const data = [val.x, val.y, val.z];
        this.addUniform(name, 3, data);
    }

    public addVec4(name: string, val: vec4) {
        const data = [val.x, val.y, val.z, val.w];
        this.addUniform(name, 4, data);
    }

    public addMat2(name: string, val: mat2) {
        // need 2 vec4
        this.addUniform(name, 8);
    }

    public addMat3(name: string, val: mat3) {
        // need 3 vec4
        this.addUniform(name,12);
    }

    public addMat4(name: string, val: mat4) {
        this.addUniform(name, 16, val.all());
    }

    // TODO: Add array
    /**
     * 
     * @param name 
     * @param data 
     * @param size number of floats
     */
    public setUniform(name: string, data: Float32Array, size: number) {
        if (!this._bufferData) {
            throw new Error("Can not set uniform before ubo build");
        }
        const uniform = this._uniforms[name];
        if (!uniform) {
            throw new Error("Uniform not exist: " + name);
        }

        for(let i = 0; i < size; i++) {
            this._bufferData[uniform.start + i] = data[i];
        }
    }

    public setFloat(name: string, val: number) {
        UniformBuffer._tmpBuffer[0] = val;
        this.setUniform(name, UniformBuffer._tmpBuffer, 1);
    }

    public setVec2(name: string, val: vec2) {
        // UniformBuffer._tmpBuffer[0] = val[0];
        // UniformBuffer._tmpBuffer[1] = val[1];
        this.setUniform(name, val.values, 2);
    }

    public setVec3(name: string, val: vec3) {
        // UniformBuffer._tmpBuffer[0] = val[0];
        // UniformBuffer._tmpBuffer[1] = val[1];
        // UniformBuffer._tmpBuffer[2] = val[2];
        this.setUniform(name, val.values, 3);
    }

    public setVec4(name: string, val: vec4) {
        // UniformBuffer._tmpBuffer[0] = val[0];
        // UniformBuffer._tmpBuffer[1] = val[1];
        // UniformBuffer._tmpBuffer[2] = val[2];
        // UniformBuffer._tmpBuffer[3] = val[3];
        this.setUniform(name, val.values, 4);
    }

    public setMat2(name: string, val: mat2) {
        // 需要按照对齐规则转换一下
        for (let i = 0; i < 2; i++) {
            UniformBuffer._tmpBuffer[i * 4 + 0] = val.at(i * 2 + 0);
            UniformBuffer._tmpBuffer[i * 4 + 1] = val.at(i * 2 + 1);
            UniformBuffer._tmpBuffer[i * 4 + 2] = 0;
            UniformBuffer._tmpBuffer[i * 4 + 3] = 0;
        }
        this.setUniform(name, UniformBuffer._tmpBuffer, 8);
    }

    public setMat3(name: string, val: mat3) {
        // 需要按照对齐规则转换一下
        for (let i = 0; i < 3; i++) {
            UniformBuffer._tmpBuffer[i * 4 + 0] = val.at(i * 2 + 0);
            UniformBuffer._tmpBuffer[i * 4 + 1] = val.at(i * 2 + 1);
            UniformBuffer._tmpBuffer[i * 4 + 2] = val.at(i * 2 + 2);
            UniformBuffer._tmpBuffer[i * 4 + 3] = 0;
        }
        this.setUniform(name, UniformBuffer._tmpBuffer, 12);
    }

    public setMat4(name: string, val: mat4) {
        this.setUniform(name, val.values, 16);
    }

    // TODO: set array

    public build() {
        if (this.glBuffer) {
            throw new Error("Already built.")
        }
        // 用当前 buffer 数据创建glUniformBuffer对象
        this._bufferData = new Float32Array(this._data);
        // console.log("build uniform buffer [" + this.name + "] with byte size: " + this._bufferData.byteLength );
        const gl = GLDevice.gl;
        this.glBuffer = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.glBuffer);
        if (this._dynamic) {
            gl.bufferData(gl.UNIFORM_BUFFER, this._bufferData, gl.DYNAMIC_DRAW);
        } else {
            gl.bufferData(gl.UNIFORM_BUFFER, this._bufferData, gl.STATIC_DRAW);
        }
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }

    public update() {
        if (!this.glBuffer || !this._bufferData) {
            throw new Error("Can not update ubo before build");
        }
        const gl = GLDevice.gl;
        // console.log("update uniform buffer [" + this.name + "] with byte size: " + this._bufferData.byteLength );
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.glBuffer);
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this._bufferData);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }

    /**
     * 用任意类型数组更新 uniform buffer；
     * @param data 包含要更新的数据的任意类型数组。注意长度需要和 ubo 创建时匹配；注意对齐；
     */
    public updateByData(data: ArrayBufferView, dstByteOffset: number, srcElemOffset: number, length: number) {
        if (!this.glBuffer || !this._bufferData) {
            throw new Error("Can not update ubo before build");
        }
        if (length <= 0) {
            return;
        }
        // if (data.byteLength + dstByteOffset > this._bufferData.byteLength) {
        //    throw new Error("buffer overrun");
        // }
        // console.log("update uniform buffer [" + this.name + "] with length: " + length );
        const gl = GLDevice.gl;
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.glBuffer);
        gl.bufferSubData(gl.UNIFORM_BUFFER, dstByteOffset, data, srcElemOffset, length);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }
    
    public release() {
        if (this.glBuffer) {
            GLDevice.gl.deleteBuffer(this.glBuffer);
            this.glBuffer = null;
        }
    }
}
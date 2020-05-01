import { vec2, vec3, vec4, mat3, mat2, mat4 } from "gl-matrix";

export class BufferHelper {
    public constructor(buffer: Float32Array) {
        this._buffer = buffer;
        this._curIdx = 0;
    }
    private _buffer: Float32Array;
    private _curIdx: number;

    public get length(): number {
        return this._curIdx;
    }

    public seek(index: number) {
        this._curIdx = index;
    }

    public addFloat(val: number) {
        this._buffer[this._curIdx++] = val;
    }

    public addFloatArray(val: Float32Array) {
        for (let i = 0; i < val.length; i++) {
            this._buffer[this._curIdx++] = val[i];
        }
    }

    // public addVec2(val: vec2) {
    //     this._buffer[this._curIdx++] = val[0];
    //     this._buffer[this._curIdx++] = val[1];
    // }

    // public addVec3(val: vec3) {
    //     this._buffer[this._curIdx++] = val[0];
    //     this._buffer[this._curIdx++] = val[1];
    //     this._buffer[this._curIdx++] = val[2];
    // }

    // public addVec4(val: vec4) {
    //     this._buffer[this._curIdx++] = val[0];
    //     this._buffer[this._curIdx++] = val[1];
    //     this._buffer[this._curIdx++] = val[2];
    //     this._buffer[this._curIdx++] = val[3];
    // }

    // public addMat2(val: mat2) {
    //     this._buffer[this._curIdx++] = val[0];
    //     this._buffer[this._curIdx++] = val[1];
    //     this._buffer[this._curIdx++] = val[2];
    //     this._buffer[this._curIdx++] = val[3];
    // }

    // public addMat3(val: mat3) {
    //     this._buffer[this._curIdx++] = val[0];
    //     this._buffer[this._curIdx++] = val[1];
    //     this._buffer[this._curIdx++] = val[2];
    //     this._buffer[this._curIdx++] = val[3];
    //     this._buffer[this._curIdx++] = val[4];
    //     this._buffer[this._curIdx++] = val[5];
    //     this._buffer[this._curIdx++] = val[6];
    //     this._buffer[this._curIdx++] = val[7];
    //     this._buffer[this._curIdx++] = val[8];
    //     this._buffer[this._curIdx++] = val[9];
    //     this._buffer[this._curIdx++] = val[10];
    //     this._buffer[this._curIdx++] = val[11];
    // }

    // public addMat4(val: mat4) {
    //     for (let i = 0; i < 16; i++) {
    //         this._buffer[this._curIdx++] = val[i];          
    //     }
    // }
}
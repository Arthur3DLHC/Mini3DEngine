import mat3 from './mat3.js'
import vec3 from './vec3.js'
import vec4 from './vec4.js'

import { epsilon } from './constants.js'
import quat from './quat.js'

export default class mat4 {
    constructor(values?: number[]) {
        if (values !== undefined) {
            this.init(values)
        }
    }

    private _values = new Float32Array(16)
    public get values(): Float32Array {
        return this._values;
    }

    static readonly identity = new mat4().setIdentity()

    at(index: number): number {
        return this._values[index]
    }

    init(values: number[]): mat4 {
        for (let i = 0; i < 16; i++) {
            this._values[i] = values[i]
        }

        return this
    }

    reset(): void {
        for (let i = 0; i < 16; i++) {
            this._values[i] = 0
        }
    }

    copyTo(dest?: mat4): mat4 {
        if (!dest) { dest = new mat4() }

        for (let i = 0; i < 16; i++) {
            dest._values[i] = this._values[i]
        }

        return dest
    }

    all(): number[] {
        const data: number[] = []
        for (let i = 0; i < 16; i++) {
            data[i] = this._values[i]
        }

        return data
    }

    row(index: number): vec4 {
        return new vec4([
            this._values[index * 4 + 0],
            this._values[index * 4 + 1],
            this._values[index * 4 + 2],
            this._values[index * 4 + 3],
        ]);
    }

    setRow(index: number, row: vec4) {
        this._values[index * 4 + 0] = row.x;
        this._values[index * 4 + 1] = row.y;
        this._values[index * 4 + 2] = row.z;
        this._values[index * 4 + 3] = row.w;
    }

    col(index: number): vec4 {
        return new vec4([
            this._values[index],
            this._values[index + 4],
            this._values[index + 8],
            this._values[index + 12],
        ]);
    }

    equals(matrix: mat4, threshold = epsilon): boolean {
        for (let i = 0; i < 16; i++) {
            if (Math.abs(this._values[i] - matrix.at(i)) > threshold) {
                return false
            }
        }

        return true
    }

    determinant(): number {
        const a00 = this._values[0]
        const a01 = this._values[1]
        const a02 = this._values[2]
        const a03 = this._values[3]
        const a10 = this._values[4]
        const a11 = this._values[5]
        const a12 = this._values[6]
        const a13 = this._values[7]
        const a20 = this._values[8]
        const a21 = this._values[9]
        const a22 = this._values[10]
        const a23 = this._values[11]
        const a30 = this._values[12]
        const a31 = this._values[13]
        const a32 = this._values[14]
        const a33 = this._values[15]

        const det00 = a00 * a11 - a01 * a10
        const det01 = a00 * a12 - a02 * a10
        const det02 = a00 * a13 - a03 * a10
        const det03 = a01 * a12 - a02 * a11
        const det04 = a01 * a13 - a03 * a11
        const det05 = a02 * a13 - a03 * a12
        const det06 = a20 * a31 - a21 * a30
        const det07 = a20 * a32 - a22 * a30
        const det08 = a20 * a33 - a23 * a30
        const det09 = a21 * a32 - a22 * a31
        const det10 = a21 * a33 - a23 * a31
        const det11 = a22 * a33 - a23 * a32

        return (det00 * det11 - det01 * det10 + det02 * det09 + det03 * det08 - det04 * det07 + det05 * det06)
    }

    setIdentity(): mat4 {
        this._values[0] = 1
        this._values[1] = 0
        this._values[2] = 0
        this._values[3] = 0
        this._values[4] = 0
        this._values[5] = 1
        this._values[6] = 0
        this._values[7] = 0
        this._values[8] = 0
        this._values[9] = 0
        this._values[10] = 1
        this._values[11] = 0
        this._values[12] = 0
        this._values[13] = 0
        this._values[14] = 0
        this._values[15] = 1

        return this
    }

    transpose(): mat4 {
        const temp01 = this._values[1]
        const temp02 = this._values[2]
        const temp03 = this._values[3]
        const temp12 = this._values[6]
        const temp13 = this._values[7]
        const temp23 = this._values[11]

        this._values[1] = this._values[4]
        this._values[2] = this._values[8]
        this._values[3] = this._values[12]
        this._values[4] = temp01
        this._values[6] = this._values[9]
        this._values[7] = this._values[13]
        this._values[8] = temp02
        this._values[9] = temp12
        this._values[11] = this._values[14]
        this._values[12] = temp03
        this._values[13] = temp13
        this._values[14] = temp23

        return this
    }

    inverse(): mat4 | null {
        const a00 = this._values[0]
        const a01 = this._values[1]
        const a02 = this._values[2]
        const a03 = this._values[3]
        const a10 = this._values[4]
        const a11 = this._values[5]
        const a12 = this._values[6]
        const a13 = this._values[7]
        const a20 = this._values[8]
        const a21 = this._values[9]
        const a22 = this._values[10]
        const a23 = this._values[11]
        const a30 = this._values[12]
        const a31 = this._values[13]
        const a32 = this._values[14]
        const a33 = this._values[15]

        const det00 = a00 * a11 - a01 * a10
        const det01 = a00 * a12 - a02 * a10
        const det02 = a00 * a13 - a03 * a10
        const det03 = a01 * a12 - a02 * a11
        const det04 = a01 * a13 - a03 * a11
        const det05 = a02 * a13 - a03 * a12
        const det06 = a20 * a31 - a21 * a30
        const det07 = a20 * a32 - a22 * a30
        const det08 = a20 * a33 - a23 * a30
        const det09 = a21 * a32 - a22 * a31
        const det10 = a21 * a33 - a23 * a31
        const det11 = a22 * a33 - a23 * a32

        let det = (det00 * det11 - det01 * det10 + det02 * det09 + det03 * det08 - det04 * det07 + det05 * det06)

        if (!det) {
            return null
        }

        det = 1.0 / det

        this._values[0] = (a11 * det11 - a12 * det10 + a13 * det09) * det
        this._values[1] = (-a01 * det11 + a02 * det10 - a03 * det09) * det
        this._values[2] = (a31 * det05 - a32 * det04 + a33 * det03) * det
        this._values[3] = (-a21 * det05 + a22 * det04 - a23 * det03) * det
        this._values[4] = (-a10 * det11 + a12 * det08 - a13 * det07) * det
        this._values[5] = (a00 * det11 - a02 * det08 + a03 * det07) * det
        this._values[6] = (-a30 * det05 + a32 * det02 - a33 * det01) * det
        this._values[7] = (a20 * det05 - a22 * det02 + a23 * det01) * det
        this._values[8] = (a10 * det10 - a11 * det08 + a13 * det06) * det
        this._values[9] = (-a00 * det10 + a01 * det08 - a03 * det06) * det
        this._values[10] = (a30 * det04 - a31 * det02 + a33 * det00) * det
        this._values[11] = (-a20 * det04 + a21 * det02 - a23 * det00) * det
        this._values[12] = (-a10 * det09 + a11 * det07 - a12 * det06) * det
        this._values[13] = (a00 * det09 - a01 * det07 + a02 * det06) * det
        this._values[14] = (-a30 * det03 + a31 * det01 - a32 * det00) * det
        this._values[15] = (a20 * det03 - a21 * det01 + a22 * det00) * det

        return this
    }

    multiply(matrix: mat4): mat4 {
        const a00 = this._values[0]
        const a01 = this._values[1]
        const a02 = this._values[2]
        const a03 = this._values[3]
        const a10 = this._values[4]
        const a11 = this._values[5]
        const a12 = this._values[6]
        const a13 = this._values[7]
        const a20 = this._values[8]
        const a21 = this._values[9]
        const a22 = this._values[10]
        const a23 = this._values[11]
        const a30 = this._values[12]
        const a31 = this._values[13]
        const a32 = this._values[14]
        const a33 = this._values[15]

        let b0 = matrix.at(0)
        let b1 = matrix.at(1)
        let b2 = matrix.at(2)
        let b3 = matrix.at(3)

        this._values[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
        this._values[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
        this._values[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
        this._values[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

        b0 = matrix.at(4)
        b1 = matrix.at(5)
        b2 = matrix.at(6)
        b3 = matrix.at(7)

        this._values[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
        this._values[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
        this._values[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
        this._values[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

        b0 = matrix.at(8)
        b1 = matrix.at(9)
        b2 = matrix.at(10)
        b3 = matrix.at(11)

        this._values[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
        this._values[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
        this._values[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
        this._values[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

        b0 = matrix.at(12)
        b1 = matrix.at(13)
        b2 = matrix.at(14)
        b3 = matrix.at(15)

        this._values[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
        this._values[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
        this._values[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
        this._values[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

        return this
    }

    multiplyVec3Normal(vector: vec3, dest?: vec3): vec3 {
        if (!dest) {
            dest = new vec3();
        }
        const x = vector.x
        const y = vector.y
        const z = vector.z

        dest.x = this._values[0] * x + this._values[4] * y + this._values[8] * z;
        dest.y = this._values[1] * x + this._values[5] * y + this._values[9] * z;
        dest.z = this._values[2] * x + this._values[6] * y + this._values[10] * z;
        return dest; 
    }

    multiplyVec3(vector: vec3, dest?: vec3): vec3 {
        if (!dest) {
            dest = new vec3();
        }
        const x = vector.x
        const y = vector.y
        const z = vector.z

        dest.x = this._values[0] * x + this._values[4] * y + this._values[8] * z + this._values[12];
        dest.y = this._values[1] * x + this._values[5] * y + this._values[9] * z + this._values[13];
        dest.z = this._values[2] * x + this._values[6] * y + this._values[10] * z + this._values[14];
        return dest;
    }

    multiplyVec4(vector: vec4, dest?: vec4): vec4 {
        if (!dest) { dest = new vec4() }

        const x = vector.x
        const y = vector.y
        const z = vector.z
        const w = vector.w

        dest.x = this._values[0] * x + this._values[4] * y + this._values[8] * z + this._values[12] * w
        dest.y = this._values[1] * x + this._values[5] * y + this._values[9] * z + this._values[13] * w
        dest.z = this._values[2] * x + this._values[6] * y + this._values[10] * z + this._values[14] * w
        dest.w = this._values[3] * x + this._values[7] * y + this._values[11] * z + this._values[15] * w

        return dest
    }

    toMat3(): mat3 {
        return new mat3([
            this._values[0],
            this._values[1],
            this._values[2],
            this._values[4],
            this._values[5],
            this._values[6],
            this._values[8],
            this._values[9],
            this._values[10],
        ])
    }

    toInverseMat3(): mat3 | null {
        const a00 = this._values[0]
        const a01 = this._values[1]
        const a02 = this._values[2]
        const a10 = this._values[4]
        const a11 = this._values[5]
        const a12 = this._values[6]
        const a20 = this._values[8]
        const a21 = this._values[9]
        const a22 = this._values[10]

        const det01 = a22 * a11 - a12 * a21
        const det11 = -a22 * a10 + a12 * a20
        const det21 = a21 * a10 - a11 * a20

        let det = a00 * det01 + a01 * det11 + a02 * det21

        if (!det) {
            return null
        }

        det = 1.0 / det

        return new mat3([
            det01 * det,
            (-a22 * a01 + a02 * a21) * det,
            (a12 * a01 - a02 * a11) * det,
            det11 * det,
            (a22 * a00 - a02 * a20) * det,
            (-a12 * a00 + a02 * a10) * det,
            det21 * det,
            (-a21 * a00 + a01 * a20) * det,
            (a11 * a00 - a01 * a10) * det,
        ])
    }

    translate(vector: vec3): mat4 {
        const x = vector.x
        const y = vector.y
        const z = vector.z

        this._values[12] += this._values[0] * x + this._values[4] * y + this._values[8] * z
        this._values[13] += this._values[1] * x + this._values[5] * y + this._values[9] * z
        this._values[14] += this._values[2] * x + this._values[6] * y + this._values[10] * z
        this._values[15] += this._values[3] * x + this._values[7] * y + this._values[11] * z

        return this
    }

    scale(vector: vec3): mat4 {
        const x = vector.x
        const y = vector.y
        const z = vector.z

        this._values[0] *= x
        this._values[1] *= x
        this._values[2] *= x
        this._values[3] *= x

        this._values[4] *= y
        this._values[5] *= y
        this._values[6] *= y
        this._values[7] *= y

        this._values[8] *= z
        this._values[9] *= z
        this._values[10] *= z
        this._values[11] *= z

        return this
    }

    rotate(angle: number, axis: vec3): mat4 | null {
        let x = axis.x
        let y = axis.y
        let z = axis.z

        let length = Math.sqrt(x * x + y * y + z * z)

        if (!length) {
            return null
        }

        if (length !== 1) {
            length = 1 / length
            x *= length
            y *= length
            z *= length
        }

        const s = Math.sin(angle)
        const c = Math.cos(angle)

        const t = 1.0 - c

        const a00 = this._values[0]
        const a01 = this._values[1]
        const a02 = this._values[2]
        const a03 = this._values[3]

        const a10 = this._values[4]
        const a11 = this._values[5]
        const a12 = this._values[6]
        const a13 = this._values[7]

        const a20 = this._values[8]
        const a21 = this._values[9]
        const a22 = this._values[10]
        const a23 = this._values[11]

        const b00 = x * x * t + c
        const b01 = y * x * t + z * s
        const b02 = z * x * t - y * s

        const b10 = x * y * t - z * s
        const b11 = y * y * t + c
        const b12 = z * y * t + x * s

        const b20 = x * z * t + y * s
        const b21 = y * z * t - x * s
        const b22 = z * z * t + c

        this._values[0] = a00 * b00 + a10 * b01 + a20 * b02
        this._values[1] = a01 * b00 + a11 * b01 + a21 * b02
        this._values[2] = a02 * b00 + a12 * b01 + a22 * b02
        this._values[3] = a03 * b00 + a13 * b01 + a23 * b02

        this._values[4] = a00 * b10 + a10 * b11 + a20 * b12
        this._values[5] = a01 * b10 + a11 * b11 + a21 * b12
        this._values[6] = a02 * b10 + a12 * b11 + a22 * b12
        this._values[7] = a03 * b10 + a13 * b11 + a23 * b12

        this._values[8] = a00 * b20 + a10 * b21 + a20 * b22
        this._values[9] = a01 * b20 + a11 * b21 + a21 * b22
        this._values[10] = a02 * b20 + a12 * b21 + a22 * b22
        this._values[11] = a03 * b20 + a13 * b21 + a23 * b22

        return this
    }

    fromTranslation(translation: vec3): mat4 {
        this._values[0] = 1;
        this._values[1] = 0;
        this._values[2] = 0;
        this._values[3] = 0;
        this._values[4] = 0;
        this._values[5] = 1;
        this._values[6] = 0;
        this._values[7] = 0;
        this._values[8] = 0;
        this._values[9] = 0;
        this._values[10] = 1;
        this._values[11] = 0;
        this._values[12] = translation.x;
        this._values[13] = translation.y;
        this._values[14] = translation.z;
        this._values[15] = 1;
        return this;
    }

    fromScaling(scaling: vec3): mat4 {
        this._values[0] = scaling.x;
        this._values[1] = 0;
        this._values[2] = 0;
        this._values[3] = 0;
        this._values[4] = 0;
        this._values[5] = scaling.y;
        this._values[6] = 0;
        this._values[7] = 0;
        this._values[8] = 0;
        this._values[9] = 0;
        this._values[10] = scaling.z;
        this._values[11] = 0;
        this._values[12] = 0;
        this._values[13] = 0;
        this._values[14] = 0;
        this._values[15] = 1;
        return this;
    }

    fromRotation(rad: number, axis: vec3): mat4 | null {
        let x = axis.x,
            y = axis.y,
            z = axis.z;
        let len = Math.hypot(x, y, z);
        let s, c, t;

        if (len < epsilon) {
            return null;
        }

        len = 1 / len;
        x *= len;
        y *= len;
        z *= len;

        s = Math.sin(rad);
        c = Math.cos(rad);
        t = 1 - c;

        // Perform rotation-specific matrix multiplication
        this._values[0] = x * x * t + c;
        this._values[1] = y * x * t + z * s;
        this._values[2] = z * x * t - y * s;
        this._values[3] = 0;
        this._values[4] = x * y * t - z * s;
        this._values[5] = y * y * t + c;
        this._values[6] = z * y * t + x * s;
        this._values[7] = 0;
        this._values[8] = x * z * t + y * s;
        this._values[9] = y * z * t - x * s;
        this._values[10] = z * z * t + c;
        this._values[11] = 0;
        this._values[12] = 0;
        this._values[13] = 0;
        this._values[14] = 0;
        this._values[15] = 1;
        return this;
    }

    fromXRotation(rad: number): mat4 {
        let s = Math.sin(rad);
        let c = Math.cos(rad);

        // Perform axis-specific matrix multiplication
        this._values[0] = 1;
        this._values[1] = 0;
        this._values[2] = 0;
        this._values[3] = 0;
        this._values[4] = 0;
        this._values[5] = c;
        this._values[6] = s;
        this._values[7] = 0;
        this._values[8] = 0;
        this._values[9] = -s;
        this._values[10] = c;
        this._values[11] = 0;
        this._values[12] = 0;
        this._values[13] = 0;
        this._values[14] = 0;
        this._values[15] = 1;
        return this;
    }

    fromYRotation(rad: number): mat4 {
        let s = Math.sin(rad);
        let c = Math.cos(rad);
      
        // Perform axis-specific matrix multiplication
        this._values[0] = c;
        this._values[1] = 0;
        this._values[2] = -s;
        this._values[3] = 0;
        this._values[4] = 0;
        this._values[5] = 1;
        this._values[6] = 0;
        this._values[7] = 0;
        this._values[8] = s;
        this._values[9] = 0;
        this._values[10] = c;
        this._values[11] = 0;
        this._values[12] = 0;
        this._values[13] = 0;
        this._values[14] = 0;
        this._values[15] = 1;
        return this;
    }

    fromZRotation(rad: number): mat4 {
        let s = Math.sin(rad);
        let c = Math.cos(rad);
      
        // Perform axis-specific matrix multiplication
        this._values[0] = c;
        this._values[1] = s;
        this._values[2] = 0;
        this._values[3] = 0;
        this._values[4] = -s;
        this._values[5] = c;
        this._values[6] = 0;
        this._values[7] = 0;
        this._values[8] = 0;
        this._values[9] = 0;
        this._values[10] = 1;
        this._values[11] = 0;
        this._values[12] = 0;
        this._values[13] = 0;
        this._values[14] = 0;
        this._values[15] = 1;    
        return this;
    }

    getTranslation(out?: vec3): vec3 {
        if (!out) {
            out = new vec3();
        }
        out.x = this._values[12];
        out.y = this._values[13];
        out.z = this._values[14];
        return out;
    }

    setTranslation(translation: vec3): mat4 {
        this._values[12] = translation.x;
        this._values[13] = translation.y;
        this._values[14] = translation.z;
        return this;
    }

    getScaling(out: vec3): vec3 {
        let m11 = this._values[0];
        let m12 = this._values[1];
        let m13 = this._values[2];
        let m21 = this._values[4];
        let m22 = this._values[5];
        let m23 = this._values[6];
        let m31 = this._values[8];
        let m32 = this._values[9];
        let m33 = this._values[10];
      
        out.x = Math.hypot(m11, m12, m13);
        out.y = Math.hypot(m21, m22, m23);
        out.z = Math.hypot(m31, m32, m33);
        return out;
    }

    getRotation(out: quat): quat {
        let scaling = new vec3();
        this.getScaling(scaling);
      
        let is1 = 1 / scaling.x;
        let is2 = 1 / scaling.y;
        let is3 = 1 / scaling.z;
      
        let sm11 = this._values[0] * is1;
        let sm12 = this._values[1] * is2;
        let sm13 = this._values[2] * is3;
        let sm21 = this._values[4] * is1;
        let sm22 = this._values[5] * is2;
        let sm23 = this._values[6] * is3;
        let sm31 = this._values[8] * is1;
        let sm32 = this._values[9] * is2;
        let sm33 = this._values[10] * is3;
      
        let trace = sm11 + sm22 + sm33;
        let S = 0;
      
        if (trace > 0) {
          S = Math.sqrt(trace + 1.0) * 2;
          out.w = 0.25 * S;
          out.x = (sm23 - sm32) / S;
          out.y = (sm31 - sm13) / S;
          out.z = (sm12 - sm21) / S;
        } else if (sm11 > sm22 && sm11 > sm33) {
          S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
          out.w = (sm23 - sm32) / S;
          out.x = 0.25 * S;
          out.y = (sm12 + sm21) / S;
          out.z = (sm31 + sm13) / S;
        } else if (sm22 > sm33) {
          S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
          out.w = (sm31 - sm13) / S;
          out.x = (sm12 + sm21) / S;
          out.y = 0.25 * S;
          out.z = (sm23 + sm32) / S;
        } else {
          S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
          out.w = (sm12 - sm21) / S;
          out.x = (sm31 + sm13) / S;
          out.y = (sm23 + sm32) / S;
          out.z = 0.25 * S;
        }
      
        return out;
    }

    fromQuat(q: quat): mat4 {
        let x = q.x,
            y = q.y,
            z = q.z,
            w = q.w;
        let x2 = x + x;
        let y2 = y + y;
        let z2 = z + z;

        let xx = x * x2;
        let yx = y * x2;
        let yy = y * y2;
        let zx = z * x2;
        let zy = z * y2;
        let zz = z * z2;
        let wx = w * x2;
        let wy = w * y2;
        let wz = w * z2;

        this._values[0] = 1 - yy - zz;
        this._values[1] = yx + wz;
        this._values[2] = zx - wy;
        this._values[3] = 0;

        this._values[4] = yx - wz;
        this._values[5] = 1 - xx - zz;
        this._values[6] = zy + wx;
        this._values[7] = 0;

        this._values[8] = zx + wy;
        this._values[9] = zy - wx;
        this._values[10] = 1 - xx - yy;
        this._values[11] = 0;

        this._values[12] = 0;
        this._values[13] = 0;
        this._values[14] = 0;
        this._values[15] = 1;
        return this;
    }

    /**
     * compose a transform matrix in scale rotation translation order
     * from Three.js: https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix4.js
     * @param position 
     * @param quaternion 
     * @param scale 
     */
    compose(position: vec3, quaternion: quat, scale: vec3): mat4 {
        const te = this._values;

		const x = quaternion.x, y = quaternion.y, z = quaternion.z, w = quaternion.w;
		const x2 = x + x,	y2 = y + y, z2 = z + z;
		const xx = x * x2, xy = x * y2, xz = x * z2;
		const yy = y * y2, yz = y * z2, zz = z * z2;
		const wx = w * x2, wy = w * y2, wz = w * z2;

		const sx = scale.x, sy = scale.y, sz = scale.z;

		te[ 0 ] = ( 1 - ( yy + zz ) ) * sx;
		te[ 1 ] = ( xy + wz ) * sx;
		te[ 2 ] = ( xz - wy ) * sx;
		te[ 3 ] = 0;

		te[ 4 ] = ( xy - wz ) * sy;
		te[ 5 ] = ( 1 - ( xx + zz ) ) * sy;
		te[ 6 ] = ( yz + wx ) * sy;
		te[ 7 ] = 0;

		te[ 8 ] = ( xz + wy ) * sz;
		te[ 9 ] = ( yz - wx ) * sz;
		te[ 10 ] = ( 1 - ( xx + yy ) ) * sz;
		te[ 11 ] = 0;

		te[ 12 ] = position.x;
		te[ 13 ] = position.y;
		te[ 14 ] = position.z;
		te[ 15 ] = 1;

        return this;
    }

    static frustum(left: number, right: number, bottom: number, top: number, near: number, far: number): mat4 {
        const rl = (right - left)
        const tb = (top - bottom)
        const fn = (far - near)

        return new mat4([
            (near * 2) / rl,
            0,
            0,
            0,

            0,
            (near * 2) / tb,
            0,
            0,

            (right + left) / rl,
            (top + bottom) / tb,
            -(far + near) / fn,
            -1,

            0,
            0,
            -(far * near * 2) / fn,
            0,
        ])
    }

    /**
     * 
     * @param fov vertical field of view, in degrees
     * @param aspect 
     * @param near 
     * @param far 
     */
    static perspective(fov: number, aspect: number, near: number, far: number): mat4 {
        const top = near * Math.tan(fov * Math.PI / 360.0)
        const right = top * aspect

        return mat4.frustum(-right, right, -top, top, near, far)
    }

    static orthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): mat4 {
        const rl = (right - left)
        const tb = (top - bottom)
        const fn = (far - near)

        return new mat4([
            2 / rl,
            0,
            0,
            0,

            0,
            2 / tb,
            0,
            0,

            0,
            0,
            -2 / fn,
            0,

            -(left + right) / rl,
            -(top + bottom) / tb,
            -(far + near) / fn,
            1,
        ])
    }

    static lookAt(position: vec3, target: vec3, up: vec3 = vec3.up, dest?: mat4): mat4 {
        if (dest === undefined) {
            dest = new mat4();
        }

        if (position.equals(target)) {
            mat4.identity.copyTo(dest);
            return dest;
        }

        // const tmpVec: vec3 = new vec3();

        const z = vec3.difference(position, target).normalize();

        const x = vec3.cross(up, z).normalize();
        const y = vec3.cross(z, x).normalize();

        return dest.init([
            x.x,
            y.x,
            z.x,
            0,

            x.y,
            y.y,
            z.y,
            0,

            x.z,
            y.z,
            z.z,
            0,

            -vec3.dot(x, position),
            -vec3.dot(y, position),
            -vec3.dot(z, position),
            1,
        ]);

        // return new mat4([
        //     x.x,
        //     y.x,
        //     z.x,
        //     0,

        //     x.y,
        //     y.y,
        //     z.y,
        //     0,

        //     x.z,
        //     y.z,
        //     z.z,
        //     0,

        //     -vec3.dot(x, position),
        //     -vec3.dot(y, position),
        //     -vec3.dot(z, position),
        //     1,
        // ])
    }

    static product(m1: mat4, m2: mat4, result?: mat4): mat4 {
        const a00 = m1.at(0)
        const a01 = m1.at(1)
        const a02 = m1.at(2)
        const a03 = m1.at(3)
        const a10 = m1.at(4)
        const a11 = m1.at(5)
        const a12 = m1.at(6)
        const a13 = m1.at(7)
        const a20 = m1.at(8)
        const a21 = m1.at(9)
        const a22 = m1.at(10)
        const a23 = m1.at(11)
        const a30 = m1.at(12)
        const a31 = m1.at(13)
        const a32 = m1.at(14)
        const a33 = m1.at(15)

        const b00 = m2.at(0)
        const b01 = m2.at(1)
        const b02 = m2.at(2)
        const b03 = m2.at(3)
        const b10 = m2.at(4)
        const b11 = m2.at(5)
        const b12 = m2.at(6)
        const b13 = m2.at(7)
        const b20 = m2.at(8)
        const b21 = m2.at(9)
        const b22 = m2.at(10)
        const b23 = m2.at(11)
        const b30 = m2.at(12)
        const b31 = m2.at(13)
        const b32 = m2.at(14)
        const b33 = m2.at(15)

        if (result) {
            result.init([
                b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
                b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
                b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
                b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,

                b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
                b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
                b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
                b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,

                b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
                b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
                b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
                b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,

                b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
                b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
                b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
                b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
            ])

            return result
        } else {
            return new mat4([
                b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
                b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
                b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
                b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,

                b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
                b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
                b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
                b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,

                b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
                b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
                b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
                b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,

                b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
                b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
                b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
                b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
            ])
        }
    }

}

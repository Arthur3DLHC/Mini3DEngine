import mat3 from './mat3.js'
import mat4 from './mat4.js'
import vec3 from './vec3.js'

import { epsilon } from './constants.js'

export default class quat {

    get x(): number {
        return this.values[0]
    }

    get y(): number {
        return this.values[1]
    }

    get z(): number {
        return this.values[2]
    }

    get w(): number {
        return this.values[3]
    }

    get xy(): [number, number] {
        return [
            this.values[0],
            this.values[1],
        ]
    }

    get xyz(): [number, number, number] {
        return [
            this.values[0],
            this.values[1],
            this.values[2],
        ]
    }

    get xyzw(): [number, number, number, number] {
        return [
            this.values[0],
            this.values[1],
            this.values[2],
            this.values[3],
        ]
    }

    set x(value: number) {
        this.values[0] = value
    }

    set y(value: number) {
        this.values[1] = value
    }

    set z(value: number) {
        this.values[2] = value
    }

    set w(value: number) {
        this.values[3] = value
    }

    set xy(values: [number, number]) {
        this.values[0] = values[0]
        this.values[1] = values[1]
    }

    set xyz(values: [number, number, number]) {
        this.values[0] = values[0]
        this.values[1] = values[1]
        this.values[2] = values[2]
    }

    set xyzw(values: [number, number, number, number]) {
        this.values[0] = values[0]
        this.values[1] = values[1]
        this.values[2] = values[2]
        this.values[3] = values[3]
    }

    constructor(values?: [number, number, number, number]) {
        if (values !== undefined) {
            this.xyzw = values
        }
    }

    private values = new Float32Array(4)

    static readonly identity = new quat().setIdentity()

    at(index: number): number {
        return this.values[index]
    }

    setAt(index: number, value: number) {
        this.values[index] = value;
    }

    setComponents(x: number, y: number, z: number, w: number) {
        this.x = x; this.y = y; this.z = z; this.w = w;
    }

    reset(): void {
        for (let i = 0; i < 4; i++) {
            this.values[i] = 0
        }
    }

    copy(dest?: quat): quat {
        if (!dest) { dest = new quat() }

        for (let i = 0; i < 4; i++) {
            dest.values[i] = this.values[i]
        }

        return dest
    }

    roll(): number {
        const x = this.x
        const y = this.y
        const z = this.z
        const w = this.w

        return Math.atan2(2.0 * (x * y + w * z), w * w + x * x - y * y - z * z)
    }

    pitch(): number {
        const x = this.x
        const y = this.y
        const z = this.z
        const w = this.w

        return Math.atan2(2.0 * (y * z + w * x), w * w - x * x - y * y + z * z)
    }

    yaw(): number {
        return Math.asin(2.0 * (this.x * this.z - this.w * this.y))
    }

    equals(vector: quat, threshold = epsilon): boolean {
        for (let i = 0; i < 4; i++) {
            if (Math.abs(this.values[i] - vector.at(i)) > threshold) {
                return false
            }
        }

        return true
    }

    setIdentity(): quat {
        this.x = 0
        this.y = 0
        this.z = 0
        this.w = 1

        return this
    }

    calculateW(): quat {
        const x = this.x
        const y = this.y
        const z = this.z

        this.w = -(Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z)))

        return this
    }

    inverse(): quat {
        const dot = quat.dot(this, this)

        if (!dot) {
            this.xyzw = [0, 0, 0, 0]

            return this
        }

        const invDot = dot ? 1.0 / dot : 0

        this.x *= -invDot
        this.y *= -invDot
        this.z *= -invDot
        this.w *= invDot

        return this
    }

    conjugate(): quat {
        this.values[0] *= -1
        this.values[1] *= -1
        this.values[2] *= -1

        return this
    }

    length(): number {
        const x = this.x
        const y = this.y
        const z = this.z
        const w = this.w

        return Math.sqrt(x * x + y * y + z * z + w * w)
    }

    normalize(dest?: quat): quat {
        if (!dest) { dest = this }

        const x = this.x
        const y = this.y
        const z = this.z
        const w = this.w

        let length = Math.sqrt(x * x + y * y + z * z + w * w)

        if (!length) {
            dest.x = 0
            dest.y = 0
            dest.z = 0
            dest.w = 0

            return dest
        }

        length = 1 / length

        dest.x = x * length
        dest.y = y * length
        dest.z = z * length
        dest.w = w * length

        return dest
    }

    add(other: quat): quat {
        for (let i = 0; i < 4; i++) {
            this.values[i] += other.at(i)
        }

        return this
    }

    multiply(other: quat): quat {
        const q1x = this.values[0]
        const q1y = this.values[1]
        const q1z = this.values[2]
        const q1w = this.values[3]

        const q2x = other.x
        const q2y = other.y
        const q2z = other.z
        const q2w = other.w

        this.x = q1x * q2w + q1w * q2x + q1y * q2z - q1z * q2y
        this.y = q1y * q2w + q1w * q2y + q1z * q2x - q1x * q2z
        this.z = q1z * q2w + q1w * q2z + q1x * q2y - q1y * q2x
        this.w = q1w * q2w - q1x * q2x - q1y * q2y - q1z * q2z

        return this
    }

    /** rotate a 3d vector */
    multiplyVec3(vector: vec3, dest?: vec3): vec3 {
        if (!dest) { dest = new vec3() }

        const x = vector.x
        const y = vector.y
        const z = vector.z

        const qx = this.x
        const qy = this.y
        const qz = this.z
        const qw = this.w

        // p' = q * p * q.inverse()
        // * means quat.multiply() 

        const ix = qw * x + qy * z - qz * y
        const iy = qw * y + qz * x - qx * z
        const iz = qw * z + qx * y - qy * x
        const iw = -qx * x - qy * y - qz * z

        dest.x = ix * qw + iw * -qx + iy * -qz - iz * -qy
        dest.y = iy * qw + iw * -qy + iz * -qx - ix * -qz
        dest.z = iz * qw + iw * -qz + ix * -qy - iy * -qx

        return dest
    }

    toMat3(dest?: mat3): mat3 {
        if (!dest) { dest = new mat3() }

        const x = this.x
        const y = this.y
        const z = this.z
        const w = this.w

        const x2 = x + x
        const y2 = y + y
        const z2 = z + z

        const xx = x * x2
        const xy = x * y2
        const xz = x * z2
        const yy = y * y2
        const yz = y * z2
        const zz = z * z2
        const wx = w * x2
        const wy = w * y2
        const wz = w * z2

        dest.init([
            1 - (yy + zz),
            xy + wz,
            xz - wy,

            xy - wz,
            1 - (xx + zz),
            yz + wx,

            xz + wy,
            yz - wx,
            1 - (xx + yy),
        ])

        return dest
    }

    toMat4(dest?: mat4): mat4 {
        if (!dest) { dest = new mat4() }

        const x = this.x
        const y = this.y
        const z = this.z
        const w = this.w

        const x2 = x + x
        const y2 = y + y
        const z2 = z + z

        const xx = x * x2
        const xy = x * y2
        const xz = x * z2
        const yy = y * y2
        const yz = y * z2
        const zz = z * z2
        const wx = w * x2
        const wy = w * y2
        const wz = w * z2

        dest.init([
            1 - (yy + zz),
            xy + wz,
            xz - wy,
            0,

            xy - wz,
            1 - (xx + zz),
            yz + wx,
            0,

            xz + wy,
            yz - wx,
            1 - (xx + yy),
            0,

            0,
            0,
            0,
            1,
        ])

        return dest
    }

    static dot(q1: quat, q2: quat): number {
        return q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w
    }

    static sum(q1: quat, q2: quat, dest?: quat): quat {
        if (!dest) { dest = new quat() }

        dest.x = q1.x + q2.x
        dest.y = q1.y + q2.y
        dest.z = q1.z + q2.z
        dest.w = q1.w + q2.w

        return dest
    }

    static product(q1: quat, q2: quat, dest?: quat): quat {
        if (!dest) { dest = new quat() }

        const q1x = q1.x
        const q1y = q1.y
        const q1z = q1.z
        const q1w = q1.w

        const q2x = q2.x
        const q2y = q2.y
        const q2z = q2.z
        const q2w = q2.w

        dest.x = q1x * q2w + q1w * q2x + q1y * q2z - q1z * q2y
        dest.y = q1y * q2w + q1w * q2y + q1z * q2x - q1x * q2z
        dest.z = q1z * q2w + q1w * q2z + q1x * q2y - q1y * q2x
        dest.w = q1w * q2w - q1x * q2x - q1y * q2y - q1z * q2z

        return dest
    }

    static cross(q1: quat, q2: quat, dest?: quat): quat {
        if (!dest) { dest = new quat() }

        const q1x = q1.x
        const q1y = q1.y
        const q1z = q1.z
        const q1w = q1.w

        const q2x = q2.x
        const q2y = q2.y
        const q2z = q2.z
        const q2w = q2.w

        dest.x = q1w * q2z + q1z * q2w + q1x * q2y - q1y * q2x
        dest.y = q1w * q2w - q1x * q2x - q1y * q2y - q1z * q2z
        dest.z = q1w * q2x + q1x * q2w + q1y * q2z - q1z * q2y
        dest.w = q1w * q2y + q1y * q2w + q1z * q2x - q1x * q2z

        return dest
    }

    static shortMix(q1: quat, q2: quat, time: number, dest?: quat): quat {
        if (!dest) { dest = new quat() }

        if (time <= 0.0) {
            dest.xyzw = q1.xyzw

            return dest
        } else if (time >= 1.0) {
            dest.xyzw = q2.xyzw

            return dest
        }

        let cos = quat.dot(q1, q2)
        const q2a = q2.copy()

        if (cos < 0.0) {
            q2a.inverse()
            cos = -cos
        }

        let k0: number
        let k1: number

        if (cos > 0.9999) {
            k0 = 1 - time
            k1 = 0 + time
        } else {
            const sin: number = Math.sqrt(1 - cos * cos)
            const angle: number = Math.atan2(sin, cos)

            const oneOverSin: number = 1 / sin

            k0 = Math.sin((1 - time) * angle) * oneOverSin
            k1 = Math.sin((0 + time) * angle) * oneOverSin
        }

        dest.x = k0 * q1.x + k1 * q2a.x
        dest.y = k0 * q1.y + k1 * q2a.y
        dest.z = k0 * q1.z + k1 * q2a.z
        dest.w = k0 * q1.w + k1 * q2a.w

        return dest
    }

    /**
     * deprecated: this function seems has problems.
     * @param q1 
     * @param q2 
     * @param time 
     * @param dest 
     */
    static mix(q1: quat, q2: quat, time: number, dest?: quat): quat {
        if (!dest) { dest = new quat() }

        const cosHalfTheta = q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w

        if (Math.abs(cosHalfTheta) >= 1.0) {
            dest.xyzw = q1.xyzw

            return dest
        }

        const halfTheta = Math.acos(cosHalfTheta)
        const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta)

        if (Math.abs(sinHalfTheta) < 0.001) {
            dest.x = q1.x * 0.5 + q2.x * 0.5
            dest.y = q1.y * 0.5 + q2.y * 0.5
            dest.z = q1.z * 0.5 + q2.z * 0.5
            dest.w = q1.w * 0.5 + q2.w * 0.5

            return dest
        }

        const ratioA = Math.sin((1 - time) * halfTheta) / sinHalfTheta
        const ratioB = Math.sin(time * halfTheta) / sinHalfTheta

        dest.x = q1.x * ratioA + q2.x * ratioB
        dest.y = q1.y * ratioA + q2.y * ratioB
        dest.z = q1.z * ratioA + q2.z * ratioB
        dest.w = q1.w * ratioA + q2.w * ratioB

        return dest
    }

    /**
     * from http://glmatrix.net/docs/quat.js.html#line296
     * https://github.com/toji/gl-matrix/blob/master/src/quat.js
     * @param a 
     * @param b 
     * @param t 
     * @param dest 
     */
    static slerp(a: quat, b: quat, t: number, dest?: quat): quat {
        if (!dest) { dest = new quat() }

        // benchmarks:
        //    http://jsperf.com/quaternion-slerp-implementations
        let ax = a.values[0],
            ay = a.values[1],
            az = a.values[2],
            aw = a.values[3];
        let bx = b.values[0],
            by = b.values[1],
            bz = b.values[2],
            bw = b.values[3];
        let omega, cosom, sinom, scale0, scale1;
        // calc cosine
        cosom = ax * bx + ay * by + az * bz + aw * bw;
        // adjust signs (if necessary)
        if (cosom < 0.0) {
            cosom = -cosom;
            bx = -bx;
            by = -by;
            bz = -bz;
            bw = -bw;
        }
        // calculate coefficients
        if (1.0 - cosom > epsilon) {
            // standard case (slerp)
            omega = Math.acos(cosom);
            sinom = Math.sin(omega);
            scale0 = Math.sin((1.0 - t) * omega) / sinom;
            scale1 = Math.sin(t * omega) / sinom;
        } else {
            // "from" and "to" quaternions are very close
            //  ... so we can do a linear interpolation
            scale0 = 1.0 - t;
            scale1 = t;
        }
        // calculate final values
        dest.x = scale0 * ax + scale1 * bx;
        dest.y = scale0 * ay + scale1 * by;
        dest.z = scale0 * az + scale1 * bz;
        dest.w = scale0 * aw + scale1 * bw;

        return dest;
    }

    /**
     * create a quaternion from rotation axis and angle
     * @param axis 
     * @param angle in radians
     * @param dest 
     */
    static fromAxisAngle(axis: vec3, angle: number, dest?: quat): quat {
        if (!dest) { dest = new quat(); }

        angle *= 0.5
        const sin = Math.sin(angle)

        dest.x = axis.x * sin
        dest.y = axis.y * sin
        dest.z = axis.z * sin
        dest.w = Math.cos(angle)

        return dest
    }

    /**
     * create a quaternion from euler angles
     * @param xRot rotation around x axis, in radians
     * @param yRot rotation around y axis, in radians
     * @param zRot rotation around z axis, in radians
     * @param order "XYZ","YXZ","ZXY","ZYX","YZX","XZY"
     * @param dest quaterion to receive the result
     */
    static fromEuler(xRot: number, yRot: number, zRot: number, order: string, dest?: quat): quat {
        if (!dest) { dest = new quat(); }

        var cos = Math.cos;
		var sin = Math.sin;

		var c1 = cos( xRot / 2 );
		var c2 = cos( yRot / 2 );
		var c3 = cos( zRot / 2 );

		var s1 = sin( xRot / 2 );
		var s2 = sin( yRot / 2 );
		var s3 = sin( zRot / 2 );

		if ( order === 'XYZ' ) {

			dest.x = s1 * c2 * c3 + c1 * s2 * s3;
			dest.y = c1 * s2 * c3 - s1 * c2 * s3;
			dest.z = c1 * c2 * s3 + s1 * s2 * c3;
			dest.w = c1 * c2 * c3 - s1 * s2 * s3;

		} else if ( order === 'YXZ' ) {

			dest.x = s1 * c2 * c3 + c1 * s2 * s3;
			dest.y = c1 * s2 * c3 - s1 * c2 * s3;
			dest.z = c1 * c2 * s3 - s1 * s2 * c3;
			dest.w = c1 * c2 * c3 + s1 * s2 * s3;

		} else if ( order === 'ZXY' ) {

			dest.x = s1 * c2 * c3 - c1 * s2 * s3;
			dest.y = c1 * s2 * c3 + s1 * c2 * s3;
			dest.z = c1 * c2 * s3 + s1 * s2 * c3;
			dest.w = c1 * c2 * c3 - s1 * s2 * s3;

		} else if ( order === 'ZYX' ) {

			dest.x = s1 * c2 * c3 - c1 * s2 * s3;
			dest.y = c1 * s2 * c3 + s1 * c2 * s3;
			dest.z = c1 * c2 * s3 - s1 * s2 * c3;
			dest.w = c1 * c2 * c3 + s1 * s2 * s3;

		} else if ( order === 'YZX' ) {

			dest.x = s1 * c2 * c3 + c1 * s2 * s3;
			dest.y = c1 * s2 * c3 + s1 * c2 * s3;
			dest.z = c1 * c2 * s3 - s1 * s2 * c3;
			dest.w = c1 * c2 * c3 - s1 * s2 * s3;

		} else if ( order === 'XZY' ) {

			dest.x = s1 * c2 * c3 - c1 * s2 * s3;
			dest.y = c1 * s2 * c3 - s1 * c2 * s3;
			dest.z = c1 * c2 * s3 + s1 * s2 * c3;
			dest.w = c1 * c2 * c3 + s1 * s2 * s3;

		}

        return dest;
    }

    /**
     * Unity-like lookat vector rotation
     * https://gamedev.net/forums/topic/613595-quaternion-lookrotationlookat-up/4876373/
     */
    static fromLookRotation(lookDir: vec3, upDir?: vec3, dest?: quat): quat {
        if (upDir === undefined) {
            upDir = new vec3([0, 1, 0]);
        }

        let forward = lookDir; var up = upDir;
        let right = vec3.cross(up, forward);

        const m00 = right.x;
        const m01 = up.x;
        const m02 = forward.x;
        const m10 = right.y;
        const m11 = up.y;
        const m12 = forward.y;
        const m20 = right.z;
        const m21 = up.z;
        const m22 = forward.z;

        if (dest === undefined) {
            dest = new quat();
        }

        dest.w = Math.sqrt(1.0 + m00 + m11 + m22) * 0.5;
        const w4_recip = 1.0 / (4.0 * dest.w);
        dest.x = (m21 - m12) * w4_recip;
        dest.y = (m02 - m20) * w4_recip;
        dest.z = (m10 - m01) * w4_recip;

        return dest;
    }
}

/**
 * functions for handwritten cubemap sampling.
 */
export default /** glsl */`
    #define CUBE_FACE_POSITIVE_X    0
    #define CUBE_FACE_NEGATIVE_X    1
    #define CUBE_FACE_POSITIVE_Y    2
    #define CUBE_FACE_NEGATIVE_Y    3
    #define CUBE_FACE_POSITIVE_Z    4
    #define CUBE_FACE_NEGATIVE_Z    5

    vec2 getCubemapTexcoord(vec3 v, out int faceId) {
        vec3 vAbs = abs(v);
        vec2 uv = vec2(0.0);
        float ma = 1.0;
        // keep same with textureCube.ts
        // local v: 1, 2, 3
        // after view transform:
        // +X:  3,  2, -1
        // -X: -3,  2,  1
        // +Y:  1,  3, -2
        // -Y:  1, -3,  2
        // +Z: -1,  2, -3
        // -Z:  1,  2,  3
        if(vAbs.z >= vAbs.x && vAbs.z >= vAbs.y) {
            faceId = v.z < 0.0 ? CUBE_FACE_NEGATIVE_Z : CUBE_FACE_POSITIVE_Z;
            uv = vec2(v.z < 0.0 ? v.x : -v.x, v.y);
            ma = 0.5 / vAbs.z;
        } else if (vAbs.y >= vAbs.x) {
            faceId = v.y < 0.0 ? CUBE_FACE_NEGATIVE_Y : CUBE_FACE_POSITIVE_Y;
            uv = vec2(v.x, v.y < 0.0 ? -v.z : v.z);
            ma = 0.5 / vAbs.y;
        } else {
            faceId = v.x < 0.0 ? CUBE_FACE_NEGATIVE_X : CUBE_FACE_POSITIVE_X;
            uv = vec2(v.x < 0.0 ? -v.z : v.z, v.y);
            ma = 0.5 / vAbs.x;
        }
        return uv * ma + 0.5;
    }

    vec3 calcNormal(int face, vec2 uv) {
        // 6 faces (+x, -x, +y, -y, +z, -z) from 0 to 5
        // from [0, 1] to [-1, 1]
        uv = uv * 2.0 - vec2(1.0);
        vec3 n = vec3(0.0);
        if (face == CUBE_FACE_POSITIVE_X) {
            n.x = 1.0;
            n.zy = uv;
        } else if (face == CUBE_FACE_NEGATIVE_X) {
            n.x = -1.0;
            n.y = uv.y;
            n.z = -uv.x;
        } else if (face == CUBE_FACE_POSITIVE_Y) {
            n.y = 1.0;
            n.xz = uv;
        } else if (face == CUBE_FACE_NEGATIVE_Y) {
            n.x = uv.x;
            n.y = -1.0;
            n.z = -uv.y;
        } else if (face == CUBE_FACE_POSITIVE_Z) {
            n.x = -uv.x;
            n.y = uv.y;
            n.z = 1.0;
        } else if (face == CUBE_FACE_NEGATIVE_Z) {
            n.xy = uv;
            n.z = -1.0;
        }
        return n;
    }

`;
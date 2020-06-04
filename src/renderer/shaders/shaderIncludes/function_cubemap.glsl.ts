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
`;
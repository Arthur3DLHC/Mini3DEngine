/**
 * functions for shadowmap sampling.
 */
export default /** glsl */`

    vec4 getPointLightShadowmapRect(int faceId, Light light) {
        if(faceId < 3) {
            return light.transform[faceId + 1];
        } else {
            return light.matShadow[faceId - 3];
        }
    }

    // get shadowmap coord for point light?
    vec4 getPointLightShadowmapCoord(vec3 pixelPos, Light light) {
        vec3 lightPosition = getPointLightPosition(light);
        vec3 v = pixelPos - lightPosition;

        // calc witch direction is the main dir
        vec3 vAbs = abs(v);
        vec3 posView = vec3(0.0,0.0,0.0);

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
            // z axis.
            // positive or negative?
            posView = vec3(v.z < 0.0 ? -v.x : v.x, -v.y, -vAbs.z);
        } else if (vAbs.y >= vAbs.x) {
            // y axis.
            posView = vec3(v.x, v.y < 0.0 ? -v.z: v.z, -vAbs.y);
        } else {
            posView = vec3(v.x < 0.0 ? v.z : -v.z, v.y, -vAbs.x);
        }



        // apply projection matrix

    }
`;
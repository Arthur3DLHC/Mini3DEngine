/**
 * functions for shadowmap sampling.
 */
export default /** glsl */`

    vec4 getPointLightShadowmapRect(int faceId, Light light) {
        if (faceId < 3) {
            return light.transform[faceId + 1];
        } else {
            return light.matShadow[faceId - 3];
        }
    }

    // get shadowmap coord for point light?
    /**
     * @param pixelPos pixel position in world space
     * @param light
     * @param matProj projection matrix with 90 degree fov and far plane set as light's max distance
     * @return projected coord in clip space, not devided by w
     */
    vec4 getPointLightShadowProjCoord(vec3 pixelPos, Light light, out int faceId) {
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
            faceId = v.z < 0.0 ? CUBE_FACE_NEGATIVE_Z : CUBE_FACE_POSITIVE_Z;
            posView = vec3(v.z < 0.0 ? v.x : -v.x, v.y, v.z < 0.0 ? v.z : -v.z);
        } else if (vAbs.y >= vAbs.x) {
            // y axis.
            faceId = v.y < 0.0 ? CUBE_FACE_NEGATIVE_Y : CUBE_FACE_POSITIVE_Y;
            posView = vec3(v.x, v.y < 0.0 ? -v.z : v.z, v.y < 0.0 ? v.y : -v.y);
        } else {
            // x axis.
            faceId = v.x < 0.0 ? CUBE_FACE_NEGATIVE_X : CUBE_FACE_POSITIVE_X;
            posView = vec3(v.x < 0.0 ? -v.z : v.z, v.y, v.x < 0.0 ? v.x : -v.x);
        }

        // todo: apply projection matrix
        // must keep same with pointLightShadow.ts
        float n = 0.01;
        float f = getLightRadius(light);
        float A = -(f + n)/(f - n);
        float B = -2.0 * f * n / (f - n);
        return vec4(posView.x, posView.y, posView.z * A + B, -posView.z);
    }
`;
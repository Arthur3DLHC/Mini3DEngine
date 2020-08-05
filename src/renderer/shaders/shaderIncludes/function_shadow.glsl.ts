/**
 * functions for shadowmap sampling.
 */
export default /** glsl */`
    #define SHADOWATLAS_SIZE 4096.0
    #define SHADOWATLAS_TEXELSIZE 0.000244140625    // 1.0 / 4096

    vec4 getPointLightShadowmapRect(int faceId, Light light) {
        if (faceId < 3) {
            return light.transform[faceId + 1];
        } else {
            return light.matShadow[faceId - 3];
        }
    }

    float getPointLightShadowBias(Light light) {
        return light.matShadow[3][0];
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

        // shadow bias should apply after shadow projection
        // posView.z -= getPointLightShadowBias(light);

        // todo: apply projection matrix
        // must keep same with pointLightShadow.ts
        float n = 0.01;
        float f = getLightRange(light);
        float A = -(f + n)/(f - n);
        float B = -2.0 * f * n / (f - n);
        return vec4(posView.x, posView.y, (posView.z) * A + B, -posView.z);
    }

    // https://github.com/BabylonJS/Babylon.js/blob/master/src/Shaders/ShadersInclude/shadowsFragmentFunctions.fx
    float shadowPCF3(sampler2DShadow shadowSampler, vec3 shadowCoord) {
        
        vec2 uv = shadowCoord.xy * SHADOWATLAS_SIZE;       	// uv in texel units
        uv += vec2(0.5);									// offset of half to be in the center of the texel
        vec2 st = fract(uv);								// how far from the center
        vec2 base_uv = floor(uv) - vec2(0.5);				// texel coord
        base_uv *= SHADOWATLAS_TEXELSIZE;				    // move back to uv coords

        // Equation resolved to fit in a 3*3 distribution like 
        // 1 2 1
        // 2 4 2 
        // 1 2 1

        vec2 uvw0 = vec2(3.0) - 2.0 * st;
        vec2 uvw1 = vec2(1.0) + 2.0 * st;
        vec2 u = vec2((2. - st.x) / uvw0.x - 1., st.x / uvw1.x + 1.) * SHADOWATLAS_TEXELSIZE;
        vec2 v = vec2((2. - st.y) / uvw0.y - 1., st.y / uvw1.y + 1.) * SHADOWATLAS_TEXELSIZE;

        float shadow = 0.;
        shadow += uvw0.x * uvw0.y * texture(shadowSampler, vec3(base_uv.xy + vec2(u[0], v[0]), shadowCoord.z));
        shadow += uvw1.x * uvw0.y * texture(shadowSampler, vec3(base_uv.xy + vec2(u[1], v[0]), shadowCoord.z));
        shadow += uvw0.x * uvw1.y * texture(shadowSampler, vec3(base_uv.xy + vec2(u[0], v[1]), shadowCoord.z));
        shadow += uvw1.x * uvw1.y * texture(shadowSampler, vec3(base_uv.xy + vec2(u[1], v[1]), shadowCoord.z));
        shadow = shadow / 16.;

        return shadow;
    }
`;
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
        vec3 posLightLocal = pixelPos - lightPosition;

        // calc witch direction is the main dir
        
    }
`;
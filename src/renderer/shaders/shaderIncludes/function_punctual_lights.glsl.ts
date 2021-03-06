/**
 * punctual lighting function
 */
export default /** glsl */`

#define LightType_Directional   1u
#define LightType_Point         2u
#define LightType_Spot          3u

uint getLightType(Light light) {
    return uint(light.properties.x);
}

float getLightRange(Light light) {
    return light.properties.y;
}

float getLightOuterConeCos(Light light) {
    return light.properties.z;
}

float getLightInnerConeCos(Light light) {
    return light.properties.w;
}

bool getLightCastShadow(Light light) {
    return light.matShadow != mat4(0.0);
}

float getRangeAttenuation(float range, float distanceSq) {
    if (range <= 0.0)
    {
        return 1.0;
    }
    // return clamp(1.0 - distance / range, 0.0, 1.0);
    // the formular in Unreal:
    // return clamp(pow(1.0 - pow(distance / range, 4.0), 2.0), 0.0, 1.0) / (distance * distance + 1.0);
    
    // modified unreal
    float distByRangeSq = distanceSq / (range * range);
    float invDistByRangeSq4 = 1.0 - distByRangeSq * distByRangeSq;
    float smoothFactor = clamp(invDistByRangeSq4 * invDistByRangeSq4, 0.0, 1.0);
    return clamp(smoothFactor / (distanceSq + 1.0), 0.0, 1.0);

    // modified formular used by Khronos group glTF Viewer:
    // https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md#range-property
    // if(distanceSq <= 0.0) return 1.0;
    // float distByRangeSq = distanceSq / (range * range);
    // float smoothFactor = clamp(1.0 - distByRangeSq * distByRangeSq, 0.0, 1.0);
    // return smoothFactor / distanceSq;

    // google filament:
    // is very similar with Unreal
    // float smoothFactor = 1.0 - distanceSq / (range * range);
    // return clamp(smoothFactor * smoothFactor, 0.0, 1.0) / max(distanceSq, 0.01);
}

float getSpotAttenuation(vec3 pointToLight, vec3 spotDirection, float outerConeCos, float innerConeCos) {
    float actualCos = dot(normalize(spotDirection), normalize(-pointToLight));
    if (actualCos > outerConeCos)
    {
        if (actualCos < innerConeCos)
        {
            return smoothstep(outerConeCos, innerConeCos, actualCos);
        }
        return 1.0;
    }
    return 0.0;
}

vec3 getPointLightPosition(Light light) {
    return light.transform[0].xyz;
}

float clampedDot(vec3 x, vec3 y) {
    return clamp(dot(x, y), 0.0, 1.0);
}
`;
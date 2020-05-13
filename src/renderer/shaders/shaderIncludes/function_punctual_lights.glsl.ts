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

float getLightRadius(Light light) {
    return light.properties.y;
}

float getLightOuterConeCos(Light light) {
    return light.properties.z;
}

float getLightInnerConeCos(Light light) {
    return light.properties.w;
}

float getRangeAttenuation(float range, float distance) {
    if (range <= 0.0)
    {
        return 1.0;
    }
    // return clamp(1.0 - distance / range, 0.0, 1.0);
    // the formular in Unreal:
    return clamp(pow(1.0 - pow(distance / range, 4.0), 2.0), 0.0, 1.0) / (distance * distance + 1.0);

    // the formular used by Khronos group glTF Viewer:
    // return max(min(1.0 - pow(distance / range, 4.0), 1.0), 0.0) / pow(distance, 2.0);
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

float clampedDot(vec3 x, vec3 y) {
    return clamp(dot(x, y), 0.0, 1.0);
}
`;
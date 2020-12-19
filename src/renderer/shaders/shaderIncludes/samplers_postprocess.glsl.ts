/**
 * common samplers for postprocesses
 */
export default /** glsl */`
uniform sampler2D s_sceneColor;
uniform sampler2D s_sceneDepth;
uniform sampler2D s_sceneNormal;        // view space normal
uniform sampler2D s_sceneSpecRough;     // rgb: specular color (for metals) a: roughness

// get view space normal
vec3 getSceneNormal(vec2 screenUV) {
    // normal tex format is RG_F16, no need to * 2 - 1
    vec2 xy = texture(s_sceneNormal, screenUV).rg;
    // DO NOT normalize xy
    // calc z?
    float z = sqrt(1.0 - dot(xy, xy));
    return vec3(xy, z);
}
`;
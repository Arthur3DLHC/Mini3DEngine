/**
 * common samplers for postprocesses
 */
export default /** glsl */`
uniform sampler2D s_sceneColor;
uniform sampler2D s_sceneDepth;
uniform sampler2D s_sceneNormalRoughSpec;

vec3 getSceneNormal(vec2 screenUV) {
    vec2 xy = texture(s_sceneNormalRoughSpec, screenUV).rg * 2.0 - vec2(1.0);
    // DO NOT normalize xy
    // calc z?
    float z = sqrt(1.0 - dot(xy, xy));
    return vec3(xy, z);
}
`;
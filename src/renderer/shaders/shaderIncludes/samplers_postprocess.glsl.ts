/**
 * common samplers for postprocesses
 */
export default /** glsl */`
uniform sampler2D s_sceneColor;
uniform sampler2D s_sceneDepth;
uniform sampler2D s_sceneNormal;        // rgb: view space normal. a: object tag
uniform sampler2D s_sceneSpecRough;     // rgb: specular color (for metals) a: roughness

// get view space normal
vec3 getSceneNormal(vec2 screenUV) {
    return texture(s_sceneNormal, screenUV).xyz;

    // == (still not enough precision, discarded.)
    // normal tex format is RG_F16, no need to * 2 - 1
    // if view z is negative, the xy was offset from [-1,1] to [9,11] when output to render target
    // see output_final.glsl.ts
    vec2 xy = texture(s_sceneNormal, screenUV).rg;
    float zSign = 1.0;
    if(xy.x >= 9.0) {
        xy -= vec2(10.0);
        zSign = -1.0;
    }
    // DO NOT normalize xy
    // calc z?
    float z = sqrt(1.0 - dot(xy, xy));
    return vec3(xy, z * zSign);
}

float getSceneTag(vec2 screenUV) {
    return texture(s_sceneNormal, screenUV).w;
}

void getSceneNormalAndTag(vec2 screenUV, vec3 normal, float tag) {
    vec4 tex = texture(s_sceneNormal, screenUV);
    normal = tex.xyz;
    tag = tex.w;
}

`;
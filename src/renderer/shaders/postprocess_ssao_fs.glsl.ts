/**
 * ssao effect
 * mostly form three.js  SSAOShader.js
 */
export default /** glsl */`
#include <uniforms_view>
// todo: define uniforms
// can they be shared?
uniform vec2 u_texelSize;               // 1.0 / textureSize of depth and normal texture
uniform vec2 u_noiseTexelSize;          // 1.0 / noise texture size

// projection and invprojection matrices can be found in u_view block

uniform vec3 u_kernel[NUM_KERNELS];     // NUM_KERNELS will be defined by postprocessor.js?
uniform float u_radius;
uniform float u_minDistance;            // in linear orthographic depth space range.
uniform float u_maxDistance;

uniform sampler2D s_noiseTex;
// fix me: use world or view space normal?
// output view space normal when rendering scene?
#include <samplers_postprocess>


in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

#include <function_depth>

float getLinearDepth(vec2 scrUV) {
    // now only have perspective camera
    float fragDepth = texture(s_sceneDepth, scrUV).r;
    float viewZ = perspectiveDepthToViewZ(fragDepth, u_view.zRange.x, u_view.zRange.y);
    return viewZToOrthoDepth(viewZ, u_view.zRange.x, u_view.zRange.y);
}

/**
 * get view z from depth value in depth texture
 */
float getViewZ(float depth) {
    return perspectiveDepthToViewZ(depth, u_view.zRange.x, u_view.zRange.y);
}

// from three.js
// can get view space position without far plane corners
// this is fantastic
vec3 getViewPosition(vec2 screenPosition, float depth, float viewZ) {
    float clipW = u_view.matProj[2][3] * viewZ + u_view.matProj[3][3];
    vec4 clipPosition = vec4( ( vec3( screenPosition, depth ) - 0.5 ) * 2.0, 1.0 );
    clipPosition *= clipW;
    return (u_view.matInvProj * clipPosition).xyz;
}

vec3 getViewNormal(vec2 screenPosition) {
    return getSceneNormal(screenPosition);
}

void main(void) {
    float depth = texture(s_sceneDepth, ex_texcoord);
    float viewZ = getViewZ(depth);

    vec3 viewPosition = getViewPosition(ex_texcoord, depth, viewZ);
    vec3 viewNormal = getViewNormal(ex_texcoord);

    vec2 noiseScale = u_noiseTexelSize / u_texelSize;   // == texture res / noisetexture res
    vec3 random = texture(s_noiseTex, ex_texcoord * noiseScale);

	// compute matrix used to reorient a kernel vector
    vec3 tangent = normalize(random - viewNormal * dot(random, viewNormal));
    vec3 bitangent = corss(viewNormal, tangent);
    mat3 kernelMatrix = mat3(tangent, bitangent, viewNormal);

    float occlusion = 0.0;

    for (int i = 0; i < NUM_KERNELS; i++) {
        vec3 sampleVector = kernelMatrix * u_kernel[i];
        vec3 samplePoint = viewPosition + (sampleVector * u_radius);

        vec4 samplePointNDC = u_view.matProj * vec4(samplePoint, 1.0);
        samplePointNDC /= samplePointNDC.w;

        vec2 samplePointUV = samplePointNDC.xy * 0.5 + vec2(0.5);

        float realDepth = getLinearDepth(samplePointUV);    // scene depth value in depth texture
        float sampleDepth = viewZToOrthoDepth(samplePoint.z, u_view.zRange.x, u_view.zRange.y); // linear depth of sample view Z
        float delta = sampleDepth - realDepth;

        if (delta > u_minDistance && delta < u_maxDistance) {
            occlusion += 1.0;
        }
    }

    occlusion = clamp(occlusion / float(NUM_KERNELS), 0.0, 1.0);
    o_color = vec4(vec3(1.0 - occlusion), 1.0);
}

`;
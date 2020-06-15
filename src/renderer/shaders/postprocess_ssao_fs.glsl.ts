/**
 * ssao effect
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
uniform float u_power;
uniform float u_minDistance;            // in linear orthographic depth space range.
uniform float u_maxDistance;
uniform float u_intensity;

uniform sampler2D s_noiseTex;
// fix me: use world or view space normal?
// output view space normal when rendering scene?
#include <samplers_postprocess>

#include <function_depth>

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

float getLinearDepth(vec2 scrUV) {
    // now only have perspective camera
    float fragDepth = texture(s_sceneDepth, scrUV).r;
    float viewZ = perspectiveDepthToViewZ(fragDepth, u_view.zRange.x, u_view.zRange.y);
    return viewZToOrthoDepth(viewZ, u_view.zRange.x, u_view.zRange.y);
}

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

}

`;
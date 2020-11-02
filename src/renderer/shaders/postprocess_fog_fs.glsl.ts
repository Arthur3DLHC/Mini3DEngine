/**
 * simple Exponential Height Fog shader
 * mostly from unreal,
 * https://docs.unrealengine.com/en-US/Engine/Actors/FogEffects/HeightFog/index.html
 * https://zhuanlan.zhihu.com/p/76627240
 */
export default /** glsl */`
uniform float u_density;
uniform vec3 u_color;
uniform int u_halfSpace;
uniform float u_height;

#include <uniforms_view>

// need the scene depth map 
#include <samplers_postprocess>

// full screen quad texcoord input
in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

#include <function_depth>

vec3 getViewPosition(vec2 screenPosition, float depth, float viewZ) {
    float clipW = u_view.matProj[2][3] * viewZ + u_view.matProj[3][3];
    vec4 clipPosition = vec4( ( vec3( screenPosition, depth ) - 0.5 ) * 2.0, 1.0 );
    clipPosition *= clipW;
    return (u_view.matInvProj * clipPosition).xyz;
}

void main(void) {
    // todo: fog cauculation
    // note: need to skip skybox pixels
    float fragDepth = texture(s_sceneDepth, ex_texcoord).r;
    float viewZ = perspectiveDepthToViewZ(fragDepth, u_view.zRange.x, u_view.zRange.y);
    vec3 viewPosition = getViewPosition(ex_texcoord, fragDepth, viewZ);
    float dist = length(viewPosition);

    float fogAmount = clamp( 1.0 - exp( -dist * u_density ), 0.0, 1.0 );

    o_color = vec4(u_color, fogAmount);
}
`;
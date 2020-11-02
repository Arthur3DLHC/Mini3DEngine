/**
 * simple Exponential Height Fog shader
 * mostly from unreal,
 * https://docs.unrealengine.com/en-US/Engine/Actors/FogEffects/HeightFog/index.html
 * https://zhuanlan.zhihu.com/p/76627240
 */
export default /** glsl */`
uniform float u_density;            // global density
uniform float u_fogHeight;          // the height of the fog
uniform float u_heightFalloff;
// uniform int u_halfSpace;
uniform float u_startDist;          // the distance the fog start to appear
uniform vec3 u_color;

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

    float deltaFogHeight = u_view.position.y - u_fogHeight;         // the height offset between camera and fog

    // density affected by height
    // float fogDensity = u_density;
    // if (u_halfSpace) {
    float fogDensity = u_density * exp( -u_heightFalloff * deltaFogHeight );
    // }

    vec3 worldPosition = (u_view.matInvView * vec4(viewPosition, 1.0)).xyz;
    float deltaObjHeight = u_view.position.y - worldPosition.y;     // the height offset between camera and object
    float falloff = u_heightFalloff * deltaObjHeight;

    float fogFactor = (1.0 - exp2( -falloff )) / falloff;

    float fog = fogDensity * fogFactor * max(dist - u_startDist, 0.0);

    // todo: inscatter?

    // todo: raymarch volumetic fog?

    // float fog = clamp( 1.0 - exp( -dist * fogDensity ), 0.0, 1.0 );

    o_color = vec4(u_color, fog);
}
`;
/**
 * simple Exponential Height Fog shader
 * mostly from unreal,
 * https://docs.unrealengine.com/en-US/Engine/Actors/FogEffects/HeightFog/index.html
 * https://zhuanlan.zhihu.com/p/76627240
 */
export default /** glsl */`
// uniform float u_fogHeightDensity;      // globalDesity * exp2( -u_heightFalloff * (camHeight - fogHeight) )
// uniform float u_heightFalloff;
// uniform float u_startDist;          // the distance the fog start to appear
// uniform float u_endDist;            // max distance; objects further will not be covered by fog

// x: fogheightdensity, globalDesity * exp2( -u_heightFalloff * (camHeight - fogHeight) )
// y: heightFalloff
// z: startDist
// w: endDist
uniform vec4 u_fogParams;
uniform vec3 u_color;

#define u_fogHeightDensity      u_fogParams.x
#define u_heightFalloff         u_fogParams.y
#define u_startDist             u_fogParams.z
#define u_endDist               u_fogParams.w

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

    if (dist > u_endDist) {
        discard;
    }

    // density affected by height
    // float fogDensity = u_density * exp2( -u_heightFalloff * (u_view.position.y - u_fogHeight) );

    vec3 worldPosition = (u_view.matInvView * vec4(viewPosition, 1.0)).xyz;
    float deltaObjHeight = worldPosition.y - u_view.position.y;     // the height offset between camera and object
    float falloff = max(-127.0, u_heightFalloff * deltaObjHeight);

    float fogFactor = (1.0 - exp2( -falloff )) / falloff;

    float fog = u_fogHeightDensity * fogFactor * max(dist - u_startDist, 0.0);

    fog = clamp(fog, 0.0, 1.0);

    // todo: inscatter?

    // todo: raymarch volumetic fog?

    // float fog = clamp( 1.0 - exp( -dist * fogDensity ), 0.0, 1.0 );

    o_color = vec4(u_color, fog);
}
`;
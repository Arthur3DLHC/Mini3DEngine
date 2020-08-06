/**
 * todo: implement default pbr shader
 */
export default /** glsl */`
// todo: 在 js 中统一指定 version?
// uniforms
#include <uniforms_scene>
#include <uniforms_view>
#include <uniforms_object>


// vertex attribute
// 使用<attribs>规定的vertex attribute
// TODO: tangents
in vec3 a_position;
in vec3 a_normal;
in vec2 a_texcoord0;

#ifdef USE_SKINNING

in vec4 a_joints0;              // joint indices
in vec4 a_weights0;             // joint weights

#include <function_skin>

#endif

// todo: include common funcitons?

#include <function_transforms>

// vertex output
out vec4 ex_hPosition;
out vec3 ex_worldPosition;      // because all lights, decals, cubemaps, irrvols are in world space, we transform position, normal to world space.
out vec3 ex_worldNormal;
out vec4 ex_color;
out vec2 ex_texcoord;

void main(void)
{
    vec4 worldPosition = localToWorld(vec4(a_position, 1.0));
    ex_worldPosition = worldPosition.xyz;
    ex_hPosition = viewToProj(worldToView(worldPosition));
    gl_Position = ex_hPosition;
    ex_color = u_object.color;
    ex_worldNormal = localToWorld(vec4(a_normal, 0.0)).xyz;
    ex_texcoord = a_texcoord0;
}

`;
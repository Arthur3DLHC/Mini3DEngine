/**
 * todo: implement default pbr shader
 */
export default /** glsl */`
// todo: 在 js 中统一指定 version?
// uniforms
#include <uniforms_scene>
#include <uniforms_view>
#include <uniforms_object>

// todo: include common funcitons?
#include <function_transforms>

// vertex attribute
// 使用<attribs>规定的vertex attribute
in vec3 a_position;
in vec3 a_normal;
in vec2 a_texcoord0;

// vertex output
out vec4 ex_hPosition;
out vec4 ex_worldPosition;      // because all lights, decals, cubemaps, irrvols are in world space, we transform position, normal to world space.
out vec3 ex_worldNormal;
out vec4 ex_color;
out vec2 ex_texcoord;

void main(void)
{
    ex_worldPosition = localToWorld(vec4(a_position, 1));
    ex_hPosition = viewToProj(worldToView(ex_worldPosition));
    gl_Position = ex_hPosition;
    ex_color = u_object.color;
    // todo: transform normal to view space
    ex_worldNormal = localToWorld(vec4(a_normal, 0)).xyz;
    ex_texcoord = a_texcoord0;
}

`;
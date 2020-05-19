/**
 * shadowmap
 */
export default /** glsl */`
// todo: 在 js 中统一指定 version?
// uniforms
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

void main(void)
{
    vec4 worldPosition = localToWorld(vec4(a_position, 1));
    ex_hPosition = viewToProj(worldToView(worldPosition));
    gl_Position = ex_hPosition;
}

`;
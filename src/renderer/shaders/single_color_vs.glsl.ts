/**
 * a simplest shader output single color for object
 */
export default /** glsl */`
// todo: 在 js 中统一指定 version?
// uniforms
#include <uniforms_scene>
#include <uniforms_frame>
#include <uniforms_view>
#include <uniforms_object>

// todo: include common funcitons?

// vertex attribute
// 使用<attribs>规定的vertex attribute
in vec3 a_position;

// vertex output
out vec4 ex_color;

void main(void)
{
    gl_Position = viewToProj(worldToView(localToWorld(vec4(a_position, 1))));
    ex_color = u_object.color;
}

`;
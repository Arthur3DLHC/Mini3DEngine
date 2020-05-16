/**
 * a textured screen space rectangle shader
 */
export default /** glsl */`
// todo: 在 js 中统一指定 version?
// uniforms
// #include <uniforms_scene>
#include <uniforms_view>
#include <uniforms_object>

// todo: include common funcitons?
#include <function_transforms>

// vertex attribute
// 使用<attribs>规定的vertex attribute
in vec3 a_position;
in vec2 a_texcoord0;

// vertex output
out vec4 ex_color;
out vec2 ex_texcoord;

void main(void)
{
    // todo: transform the rectangle by world matrix only (to set the size and position on screen)
    // use a plane geometry ( x 0 z plane ), so need to swap y and z
    gl_Position.xyzw = localToWorld(vec4(a_position.xzy, 1));
    ex_color = u_object.color;
    ex_texcoord = a_texcoord0;
}

`;
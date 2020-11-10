/**
 * use GPU vertex transform feedback to update particles
 */
export default /** glsl */`
// todo: 在 js 中统一指定 version?
// uniforms
#include <uniforms_scene>
#include <uniforms_view>
#include <uniforms_object>


// vertex attribute
in vec3 a_position;
// todo: 粒子的其他属性

// 注意不要添加无用的 vertex 输入，否则 instancing 会出问题
// in vec3 a_normal;
// in vec2 a_texcoord0;

#include <function_transforms>

// vertex output
out vec4 ex_color;

void main(void)
{
    vec4 worldPosition = vec4(0.);
    vec4 localPosition = vec4(a_position, 1.0);
    worldPosition = localToWorld(localPosition);
    gl_Position = viewToProj(worldToView(worldPosition));
    ex_color = u_object.color;
}

`;
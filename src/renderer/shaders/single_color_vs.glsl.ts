/**
 * a simplest shader output single color for object
 */
export default /** glsl */`
// todo: 在 js 中统一指定 version?
// uniforms
#include <uniforms_scene>
#include <uniforms_view>
#include <uniforms_object>


// vertex attribute
// 使用<attribs>规定的vertex attribute
in vec3 a_position;
in vec3 a_normal;
in vec2 a_texcoord0;

in vec4 a_joints0;              // joint indices
in vec4 a_weights0;             // joint weights

// vertex attribute instancing?
in mat4 a_instanceMatrix;
in vec4 a_instanceColor;

#include <function_skin>
#include <function_transforms>
#include <function_instance>

// vertex output
out vec4 ex_color;

void main(void)
{
    vec4 worldPosition = vec4(0.);
    vec4 localPosition = vec4(a_position, 1.0);
    if (useInstancing()) {
        worldPosition = localToWorldInst(localPosition);
    } else {
        worldPosition = localToWorldCheckSkin(localPosition);
    }
    gl_Position = viewToProj(worldToView(worldPosition));
    ex_color = u_object.color;
}

`;
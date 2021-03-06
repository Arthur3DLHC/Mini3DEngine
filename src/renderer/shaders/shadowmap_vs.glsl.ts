/**
 * shadowmap
 */
export default /** glsl */`
// todo: 在 js 中统一指定 version?
#include <attrib_locations>

// uniforms
#include <uniforms_view>
#include <uniforms_object>


// vertex attribute
// 使用<attribs>规定的vertex attribute
layout(location = POSITION_LOCATION) in vec3 a_position;
// 注意不要添加无用的 vertex 输入，否则 instancing 会出问题
// in vec3 a_normal;
// in vec2 a_texcoord0;

layout(location = JOINTS0_LOCATION) in vec4 a_joints0;              // joint indices
layout(location = WEIGHTS0_LOCATION) in vec4 a_weights0;             // joint weights

// vertex attribute instancing?
layout(location = INSTANCE_MATRIX_LOCATION) in mat4 a_instanceMatrix;
layout(location = INSTANCE_COLOR_LOCATION) in vec4 a_instanceColor;

// todo: include common funcitons?
#include <function_skin>
#include <function_transforms>
#include <function_instance>

// vertex output
out vec4 ex_hPosition;

void main(void)
{
    vec4 worldPosition = vec4(0.);
    vec4 localPosition = vec4(a_position, 1.0);
    if (useInstancing()) {
        worldPosition = localToWorldInst(localPosition);
    } else {
        worldPosition = localToWorldCheckSkin(localPosition);
    }
    ex_hPosition = viewToProj(worldToView(worldPosition));
    gl_Position = ex_hPosition;
}

`;
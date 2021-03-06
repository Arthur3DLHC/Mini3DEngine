/**
 * todo: implement default pbr shader
 */
export default /** glsl */`
// the version and precision will be specified in js

#include <attrib_locations>

// uniforms
// #include <uniforms_scene>
#include <uniforms_view>
#include <uniforms_object>


// vertex attribute
// TODO: tangents
layout(location = POSITION_LOCATION)    in vec3 a_position;
layout(location = NORMAL_LOCATION)      in vec3 a_normal;
layout(location = TEXCOORD0_LOCATION)   in vec2 a_texcoord0;
// 注意不要添加无用的 vertex 输入，否则 instancing 会出问题

// #ifdef USE_SKINNING

layout(location = JOINTS0_LOCATION)     in vec4 a_joints0;              // joint indices
layout(location = WEIGHTS0_LOCATION)    in vec4 a_weights0;             // joint weights

// vertex attribute instancing?
layout(location = INSTANCE_MATRIX_LOCATION) in mat4 a_instanceMatrix;
layout(location = INSTANCE_COLOR_LOCATION) in vec4 a_instanceColor;

#include <function_skin>
#include <function_instance>

// #endif

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
    vec4 worldPosition = vec4(0.);
    vec4 localPosition = vec4(a_position, 1.0);
    if (useInstancing()) {
        worldPosition = localToWorldInst(localPosition);
        ex_worldNormal = normalize(localToWorldInst(vec4(a_normal, 0.0)).xyz);
    } else {
        worldPosition = localToWorldCheckSkin(localPosition);
        ex_worldNormal = normalize(localToWorldCheckSkin(vec4(a_normal, 0.0)).xyz);
    }
    ex_worldPosition = worldPosition.xyz;
    ex_hPosition = viewToProj(worldToView(worldPosition));
    gl_Position = ex_hPosition;
    ex_color = u_object.color;
    ex_texcoord = a_texcoord0;
}

`;
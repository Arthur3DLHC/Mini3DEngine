/**
 * common vertex shader inputs
 * compatible with gltf model
 * must include <attrib_locations> before include this file!
 */
export default /** glsl */`

layout(location = POSITION_LOCATION)    in vec3 a_position;
layout(location = NORMAL_LOCATION)      in vec3 a_normal;
layout(location = TANGENT_LOCATION)     in vec3 a_tangent;
layout(location = TEXCOORD0_LOCATION)   in vec2 a_texcoord0;
layout(location = TEXCOORD1_LOCATION)   in vec2 a_texcoord1;
// 注意不要添加无用的 vertex 输入，否则 instancing 会出问题

// #ifdef USE_SKINNING

layout(location = JOINTS0_LOCATION)     in vec4 a_joints0;              // joint indices
layout(location = WEIGHTS0_LOCATION)    in vec4 a_weights0;             // joint weights

layout(location = COLOR0_LOCATION)      in vec4 a_color0;              // for gltf models have vertex colors

// vertex attribute instancing?
layout(location = INSTANCE_MATRIX_LOCATION) in mat4 a_instanceMatrix;      // take 4 locations
layout(location = INSTANCE_COLOR_LOCATION) in vec4 a_instanceColor;

`;
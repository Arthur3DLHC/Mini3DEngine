/**
 * scene sky box shader
 */
export default /** glsl */`
#include <attrib_locations>
#include <uniforms_view>
#include <uniforms_object>

// vertex attribute
// 使用<attribs>规定的vertex attribute
layout(location = POSITION_LOCATION) in vec3 a_position;
// 不需要法线和纹理坐标
layout(location = NORMAL_LOCATION) in vec3 a_normal;
layout(location = TEXCOORD0_LOCATION) in vec2 a_texcoord0;

#include <function_transforms>

out vec3 ex_worldDir;
// out vec3 ex_normal;
// out vec2 ex_texcoord;

void main(void)
{
    ex_worldDir = (u_object.matWorld * vec4(a_position, 0.0)).xyz;
    vec4 worldPosition = localToWorld(vec4(a_position, 1.0));
    gl_Position = viewToProj(worldToView(worldPosition));
	// gl_Position.z = gl_Position.w; // set z to camera.far (from Three.js, cube_vert.glsl.js)
    // ex_normal = a_normal;
    // ex_texcoord = a_texcoord0;
}
`;
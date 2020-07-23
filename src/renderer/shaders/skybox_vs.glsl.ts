/**
 * scene sky box shader
 */
export default /** glsl */`
#include <uniforms_view>
#include <uniforms_object>

#include <function_transforms>

// vertex attribute
// 使用<attribs>规定的vertex attribute
in vec3 a_position;
// 不需要法线和纹理坐标
// in vec3 a_normal;
// in vec2 a_texcoord0;

out vec3 ex_worldDir;

void main(void)
{
    ex_worldDir = (u_object.matWorld * vec4(a_position, 0.0)).xyz;
    vec4 worldPosition = localToWorld(vec4(a_position, 1.0));
    gl_Position = viewToProj(worldToView(worldPosition));
	gl_Position.z = gl_Position.w; // set z to camera.far (from Three.js, cube_vert.glsl.js)
}
`;
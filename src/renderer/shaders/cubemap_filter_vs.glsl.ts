/**
 * cubemap (texture2darray) diffuse filter
 */
export default /** glsl */`
// no transform matrix uniforms needed
#include <attrib_locations>

// vertex attribute
// 使用<attribs>规定的vertex attribute
layout(location = POSITION_LOCATION) in vec3 a_position;
layout(location = TEXCOORD0_LOCATION)in vec2 a_texcoord0;

// vertex output
out vec2 ex_texcoord;

void main(void)
{
    // full screen quad
    gl_Position = vec4(a_position.xzy, 1.0);
    ex_texcoord = a_texcoord0;
}
`;

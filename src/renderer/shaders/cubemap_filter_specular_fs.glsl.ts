/**
 * cubemap (texture2darray) specular filter
 */
export default /** glsl */`
precision lowp sampler2DArray;

#include <function_cubemap>

uniform sampler2DArray      s_source;
uniform int                 u_layer;

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

void main(void)
{
    // test simple copy
    o_color = texture(s_source, vec3(ex_texcoord, float(u_layer)));
}

`;

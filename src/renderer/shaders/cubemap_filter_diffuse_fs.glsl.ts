/**
 * cubemap (texture2darray) diffuse filter
 */
export default /** glsl */`
precision lowp sampler2DArray;

uniform sampler2DArray      s_source;
uniform int                 u_layer;

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

void main(void)
{
    // todo: sample source and do a Riemann Sum
}

`;

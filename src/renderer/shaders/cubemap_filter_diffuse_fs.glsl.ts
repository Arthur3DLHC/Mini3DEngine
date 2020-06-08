/**
 * cubemap (texture2darray) diffuse filter
 * https://blog.csdn.net/i_dovelemon/article/details/79091105
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
    // todo: sample source and do a Riemann Sum

    // get face index from UV
    vec2 uv = ex_texcoord * vec2(6.0, 1.0);
    float u = floor(uv.x);
    int faceIdx = int(u);
    uv.x -= u;

    // calculate normal from UV


    // sample cubemap face; use linear filter;

    // aware border pixels; filter with adj face;


}

`;

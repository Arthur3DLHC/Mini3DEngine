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

vec3 calcNormal(int face, vec2 uv) {
    // 6 faces (+x, -x, +y, -y, +z, -z) from 0 to 5
    // from [0, 1] to [-1, 1]
    uv = uv * 2.0 - vec2(1.0);
    vec3 n = vec3(0.0);
    if (face == CUBE_FACE_POSITIVE_X) {
        n.x = 1.0;
        n.zy = uv;
    } else if (face == CUBE_FACE_NEGATIVE_X) {
        n.x = -1.0;
        n.y = uv.y;
        n.z = -uv.x;
    } else if (face == CUBE_FACE_POSITIVE_Y) {
        n.y = 1.0;
        n.xz = uv;
    } else if (face == CUBE_FACE_NEGATIVE_Y) {
        n.x = uv.x;
        n.y = -1.0;
        n.z = -uv.y;
    } else if (face == CUBE_FACE_POSITIVE_Z) {
        n.x = -uv.x;
        n.y = uv.y;
        n.z = 1.0;
    } else if (face == CUBE_FACE_NEGATIVE_Z) {
        n.xy = uv;
        n.z = -1.0;
    }
    return n;
}

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

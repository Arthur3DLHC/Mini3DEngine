/**
 * edge detect shader
 */
export default /** glsl */`
#include <samplers_postprocess>
// uniform sampler2D s_source;     // should use tag render target?
// uniform float u_blurRadius;
uniform vec2 u_unitOffset;      // horiz (blurRadius * texelSize, 0.0) or vertical (0.0, blurRadius * texelSize)
// todo: gaussian kernels?
// hardcode here or pass in?

uniform int u_selectMode;       // 0 - outline around every object, 1 - outline object with tag == u_tagREf, 2 - outline object with tag == texture(s_source, u_cursorPosition).r
uniform float u_tagRef;
uniform vec2 u_positionRef;     // xy ranges [0, 1]

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

void main(void) {
    const float weight[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
    vec4 result = texture(s_source, ex_texcoord) * weight[0];
    for (int i = 1; i < 5; i++) {
        vec2 offset = u_unitOffset * float(i);
        result += texture(s_source, ex_texcoord + offset) * weight[i];
        result += texture(s_source, ex_texcoord - offset) * weight[i];
    }
    o_color = result;
    // o_color = texture(s_source, ex_texcoord);
}

`;
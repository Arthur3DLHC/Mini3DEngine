/**
 * tone mapping
 */
export default /** glsl */`
uniform sampler2D s_sceneColor;
uniform int u_Enable;

#include <function_tonemap>

in vec2 ex_texcoord;

// output lightprepass and tone mapped texture?
layout(location = 0) out vec4 o_color;

void main(void) {
    // 先只做tonemapping，不做birght prepass？
    if(u_Enable == 1) {
        o_color = clamp(vec4(ACESToneMapping(texture(s_sceneColor, ex_texcoord).rgb, 1.0), 1.0), vec4(0.0), vec4(1.0));
    } else {
        o_color = texture(s_sceneColor, ex_texcoord);
    }
}
`;
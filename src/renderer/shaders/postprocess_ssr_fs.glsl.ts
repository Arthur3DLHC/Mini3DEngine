/**
 * screen space reflection
 */
export default /** glsl */`
#include <uniforms_view>
#include <samplers_postprocess>     // s_sceneColor contains prev frame image

// todo: uniforms

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

#include <function_depth>

void main(void) {
    o_color = vec4(1.0);
}

`;
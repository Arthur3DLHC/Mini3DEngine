/**
 * get bright piexels from the scene image, for glow or bloom effect
 * https://learnopengl.com/Advanced-Lighting/Bloom
 */
export default /** glsl */`
uniform float u_threshold;

// samplers
#include <samplers_postprocess>

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

void main(void) {
    // fix me: this can be done in tonemapping shader?
    vec4 sceneColor = texture(s_sceneColor, ex_texcoord);
    sceneColor.rgb -= vec3(u_threshold);
    o_color = sceneColor;
}
`;
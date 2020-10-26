/**
 * simple fog shader
 * exp fog, support height half space
 */
export default /** glsl */`
uniform float u_density;
uniform vec3 u_color;
uniform int u_halfSpace;
uniform float u_height;
// need the scene depth map 
#include <samplers_postprocess>

// full screen quad texcoord input
in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

#include <function_depth>

void main(void) {
    // todo: fog cauculation
    o_color = vec4(u_color, 0.5);
}
`;
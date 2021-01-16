/**
 * copy object tag and id, normal, depth from scene maps to picking RT
 */
export default /** glsl */`
#include <samplers_postprocess>

uniform vec4        u_TexcoordScaleOffset;

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_objTagID;
layout(location = 1) out vec4 o_normal;
layout(location = 2) out vec4 o_linearDepth;

void main(void) {

    o_objTagID = vec4(0.0);
    o_normal = vec4(0.0);
    o_linearDepth = vec4(0.0);
    // o_color = texture(s_source, ex_texcoord);
}

`;
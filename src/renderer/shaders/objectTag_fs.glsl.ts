/**
 * copy object tag, normal, depth from scene maps to picking RT
 */
export default /** glsl */`
#include <uniforms_view>
#include <samplers_postprocess>
#include <function_depth>

in vec2 ex_texcoord;

layout(location = 0) out int o_objTagID;
layout(location = 1) out vec4 o_normal;
layout(location = 2) out float o_linearDepth;

void main(void) {
    vec4 normalAndTag = texture(s_sceneNormal, ex_texcoord);
    float fragDepth = texture(s_sceneDepth, ex_texcoord).r;

    o_objTagID = int(normalAndTag.a);
    o_normal = vec4(normalAndTag.rgb, 1.0);
    o_linearDepth = perspectiveDepthToViewZ(fragDepth, u_view.zRange.x, u_view.zRange.y);

    // o_color = texture(s_source, ex_texcoord);
}

`;
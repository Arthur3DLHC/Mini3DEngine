/**
 * a textured screen space rectangle shader
 */
export default /** glsl */`
// #include <uniforms_scene>
#include <uniforms_view>
#include <uniforms_object>
#include <uniforms_mtl_pbr>
#include <output_final>
in vec4 ex_color;
in vec2 ex_texcoord;
void main(void)
{
    FinalOutput o = defaultFinalOutput();
    // todo: use base color or basecolormap
    vec4 texColor = texture(s_baseColorMap, ex_texcoord);
    o.color = mix(ex_color, texColor, u_material.colorMapAmount);
    o.color.a = 1.0;

    outputFinal(o);
}
`;
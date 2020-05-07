/**
 * a simplest shader output single color for object
 */
export default /** glsl */`
#include <uniforms_scene>
#include <uniforms_frame>
#include <uniforms_view>
#include <uniforms_object>
#include <uniforms_mtl_pbr>
#include <output_final>
in vec4 ex_color;
void main(void)
{
    FinalOutput o = defaultFinalOutput();
    o.color = ex_color;
    outputFinal(o);
}
`;
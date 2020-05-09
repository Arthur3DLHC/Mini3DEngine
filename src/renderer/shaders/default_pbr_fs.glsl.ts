/**
 * todo: implement default pbr shader
 */
export default /** glsl */`
#include <uniforms_scene>
#include <uniforms_view>
#include <uniforms_object>
#include <uniforms_mtl_pbr>
#include <output_final>
in vec4 ex_color;
in vec3 ex_normal;
in vec2 ex_texcoord;
void main(void)
{
    FinalOutput o = defaultFinalOutput();
    // o.color = ex_color;
    vec3 normal = normalize(ex_normal);
    o.color.xyz = (normal + vec3(1.0,1.0,1.0)) * 0.5;
    o.color.w = 1.0;
    outputFinal(o);
}
`;
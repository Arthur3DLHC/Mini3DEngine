/**
 * todo: implement default pbr shader
 */
export default /** glsl */`
#include <uniforms_scene>
#include <uniforms_view>
#include <uniforms_object>
#include <uniforms_mtl_pbr>

#include <function_cluster>
#include <function_get_lights>

#include <output_final>
in vec4 ex_hPosition;
in vec4 ex_worldPosition;      // because all lights, decals, cubemaps, irrvols are in world space, we transform position, normal to world space.
in vec3 ex_worldNormal;
in vec4 ex_color;
in vec2 ex_texcoord;
void main(void)
{
    FinalOutput o = defaultFinalOutput();
    // o.color = ex_color;

    // test normal
    vec3 normal = normalize(ex_worldNormal);
    o.color.xyz = (normal + vec3(1.0,1.0,1.0)) * 0.5;
    o.color.w = 1.0;

    // test texcoord
    // o.color = vec4(ex_texcoord, 1, 1);

    outputFinal(o);
}
`;
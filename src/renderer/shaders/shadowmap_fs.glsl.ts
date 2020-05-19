/**
 * shadowmap
 */
export default /** glsl */`
#include <uniforms_view>
#include <uniforms_object>
#include <output_final>

in vec4 ex_hPosition;

void main(void)
{
    FinalOutput o = defaultFinalOutput();
    float depth = ex_hPosition.z / ex_hPosition.w;
    // float depth = 0.0;
    o.color = vec4(depth, depth, depth, 1.0);
    outputFinal(o);
}
`;
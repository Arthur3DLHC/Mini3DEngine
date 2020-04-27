/**
 * a simplest shader output single color for object
 */
export default /** glsl */`
#include <output_final>
in vec4 ex_color;
void main(void)
{
    FinalOutput o = defaultFinalOutput();
    o.color = ex_color;
    outputFinal(o);
}
`;
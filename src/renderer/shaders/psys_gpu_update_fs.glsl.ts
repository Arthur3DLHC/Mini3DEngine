/**
 * a dummy empty fragment shader for transform feedback program to update particles
 * because webgl do not allow programs without a fragment shader
 */
export default /** glsl */`

layout(location = 0) out vec4 o_color;

void main(void)
{
    o_color = vec4(1.0, 1.0, 1.0, 1.0);
}
`;
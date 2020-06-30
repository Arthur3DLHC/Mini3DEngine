/**
 * pre-integrate subsurface scattering BRDF
 * use an easy way
 */
export default /** glsl */`
in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

void main(void) {
    o_color = vec4(1.0);
}
`;
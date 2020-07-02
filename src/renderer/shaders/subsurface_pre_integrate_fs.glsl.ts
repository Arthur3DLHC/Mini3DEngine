/**
 * pre-integrate subsurface scattering BRDF
 * use an easy way
 */
export default /** glsl */`
in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

void main(void) {
    float curvature = ex_texcoord.t;
    // todo: blur ndotl by curvature
    float ndotl = ex_texcoord.s * 2.0 - 1.0;
    float wrap = curvature * 0.1;
    ndotl = max(0.0, (ndotl + wrap) / (1.0 + wrap));

    // subsurface color strenth by curvature
    // float subsurf = abs(ex_texcoord.s * 2.0 - 1.0);
    // float subsurfWidth = curvature * curvature;

    // todo: test use multiple Gaussian curves with different deltas ?
    float x = ex_texcoord.s * 2.0 - 1.0;
    float delta = curvature;
    // float delta = 0.5 * curvature;
    float gaussian = exp(-((x * x) / (2.0 * delta * delta)));
    float gaussian1 = pow(gaussian, 15.0);
    float subsurfStrength = (gaussian * 0.5 + gaussian1 * 0.5) * curvature;
    // float subsurfStrength = (1.0 - smoothstep(0.0, subsurfWidth, subsurf)) * curvature * curvature;

    // debug test combine color
    // vec3 subsufColor = vec3(0.4, 0.06, 0.0) * subsurfStrength;
    // vec3 color = vec3(ndotl) + subsufColor;
    // o_color = vec4(subsufColor, 1.0);
    // o_color = vec4(color, 1.0);
    //o_color = vec4(subsurfStrength, subsurfStrength, subsurfStrength, 1.0);

    o_color = vec4(subsurfStrength, subsurfStrength, subsurfStrength, 1.0);
}
`;
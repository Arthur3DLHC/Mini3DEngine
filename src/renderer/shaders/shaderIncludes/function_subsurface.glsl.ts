/**
 * functions for subsurface scattering.
 */
export default /** glsl */`
uniform sampler2D s_subsurfBRDF;

// calc curvature
float calcCurvature(vec3 n, vec3 pos) {
    // https://zhuanlan.zhihu.com/p/43244741
    // 0.01 is an adjust factor
    return clamp(0.05 * length(fwidth(n)) / length(fwidth(pos)), 0.0, 1.0);

    // http://madebyevan.com/shaders/curvature/, not very good
    // vec3 dx = dFdx(n);
    // vec3 dy = dFdy(n);
    // vec3 xneg = n - dx;
    // vec3 xpos = n + dx;
    // vec3 yneg = n - dy;
    // vec3 ypos = n + dy;
    // return (cross(xneg, xpos).y - cross(yneg, ypos).x) * 4.0 / abs(viewZ);
}

// sample pre-integrated subsurface BRDF texture, calculate subsurface color?
vec4 subsurfaceScattering(float ndotl, float curvature, vec3 subsurfaceColor, float subsurfaceAmount) {
    vec2 uv = vec2(ndotl * 0.5 + 0.5, curvature);
    float subsurf = texture(s_subsurfBRDF, uv).r;
    // return subsurf * subsurfaceColor * subsurfaceAmount;
    return vec4(subsurfaceColor * subsurfaceAmount, subsurf);
}

// https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/master/src/shaders/punctual.glsl, fixed some errors
// https://www.alanzucconi.com/2017/08/30/fast-subsurface-scattering-2/
// https://colinbarrebrisebois.com/2011/03/07/gdc-2011-approximating-translucency-for-a-fast-cheap-and-convincing-subsurface-scattering-look/
// note: the result value should be multiplied with diffuse lighting color
vec3 subsurfaceRadiance(vec3 n, vec3 v, vec3 l, float scale, float distortion, float power, vec3 color, float thickness) {
    vec3 distortedHalfway = l + n * distortion;
    float backIntensity = max(0.0, dot(v, -distortedHalfway));
    float reverseDiffuse = pow(clamp(backIntensity, 0.0, 1.0), power) * scale; // original code clamp funciton is wrong
    return (reverseDiffuse + color) * (1.0 - thickness);
}

// note: the result value need to multiply with diffuse IBL color
vec3 subsurfaceRadianceIBL(vec3 n, vec3 v, float scale, float distortion, float power, vec3 color, float thickness) {
    return subsurfaceRadiance(n, v, -v, scale, distortion, power, color, thickness);
}

`;
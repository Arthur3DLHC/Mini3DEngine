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
`;
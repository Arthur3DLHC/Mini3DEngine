/**
 * cubemap (texture2darray) diffuse filter
 * https://blog.csdn.net/i_dovelemon/article/details/79091105
 */
export default /** glsl */`
precision mediump sampler2DArray;

#include <function_cubemap>

const float PI = 3.1415926536898;

uniform sampler2DArray      s_source;
uniform int                 u_envmapIdx;
uniform int                 u_faceIdx;

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

vec3 calcCartesian(float phi, float theta) {
    return vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));
}

vec3 convolurionCubeMap(int faceIndex, vec2 uv) {
     // Calculate tangent space base vector
    vec3 n = calcNormal(faceIndex, uv);
    n = normalize(n);
    vec3 u = vec3(0.0, 1.0, 0.0);
    vec3 r = cross(u, n);
    r = normalize(r);
    u = cross(n, r);
    u = normalize(u);

    // Convolution
    float samplingStep = 0.025;
    float samples = 0.0;
    vec3 lum = vec3(0.0, 0.0, 0.0);
    for (float phi = 0.0; phi < 2.0 * PI; phi = phi + samplingStep) {
        for (float theta = 0.0; theta < 0.5 * PI; theta = theta + samplingStep) {
            vec3 d = calcCartesian(phi, theta);  // Transform spherical coordinate to cartesian coordinate
            d = d.x * r + d.y * u + d.z * n;  // Transform tangent space coordinate to world space coordinate
            // int sampleFaceIdx = 0;
            // vec2 cubeUV = getCubemapTexcoord(d, sampleFaceIdx);
            // vec3 texColor = sampleCubeMapArray(s_source, cubeUV, sampleFaceIdx, u_layer).rgb;
            vec3 texColor = textureCubeArray(s_source, d, u_envmapIdx).rgb;
            lum = lum + texColor * cos(theta) * sin(theta);  // L * (ndotl) * sin(theta) d(theta)d(phi)
            samples = samples + 1.0;
        }
    }
    lum = PI * lum * (1.0 / samples);

    return lum;
}

void main(void)
{
    // sample source and do a Riemann Sum

    // get face index from UV
    // vec2 uv = ex_texcoord * vec2(6.0, 1.0);
    // float u = floor(uv.x);
    // int faceIdx = int(u);
    // uv.x -= u;

    vec2 uv = ex_texcoord;
    int faceIdx = u_faceIdx;

    vec3 color = convolurionCubeMap(faceIdx, uv);
    o_color = vec4(color, 1.0);
}

`;

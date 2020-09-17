/**
 * cubemap (texture2darray) specular filter
 * https://blog.csdn.net/i_dovelemon/article/details/79251920
 * https://blog.csdn.net/i_dovelemon/article/details/79598921
 */
export default /** glsl */`
precision mediump sampler2DArray;

#include <function_cubemap>
#include <function_ibl>

uniform sampler2DArray      s_source;
uniform int                 u_envmapIdx;
uniform int                 u_faceIdx;
uniform float               u_roughness;

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;



vec3 convolutionCubeMap(sampler2DArray s, int faceIndex, vec2 uv) {
    // Calculate tangent space base vector
    vec3 n = calcNormal(faceIndex, uv);
    n = normalize(n);
    vec3 v = n;
    vec3 r = n;

    // Convolution
    uint samples = 1024u;
    vec3 color = vec3(0.0, 0.0, 0.0);
    float weight = 0.0;
    for(uint i = 0u; i < samples; i++) {
        vec2 xi = hammersley(i, samples);
        vec3 h = importanceSamplingGGX(xi, u_roughness, n);
        vec3 l = 2.0 * dot(v, h) * h - v;

        float ndotl = max(0.0, dot(n, l));
        if (ndotl > 0.0) {
            color = color + textureCubeArray(s, l, u_envmapIdx).xyz * ndotl;
            weight = weight + ndotl;
        }
    }
    color = color / weight;
    return color;
}

void main(void)
{
    // test simple copy
    // o_color = texture(s_source, vec3(ex_texcoord, float(u_layer)));

    // vec2 uv = ex_texcoord * vec2(6.0, 1.0);
    // float u = floor(uv.x);
    // int faceIdx = int(u);
    // uv.x -= u;
    vec2 uv = ex_texcoord;
    int faceIdx = u_faceIdx;

    vec3 color = convolutionCubeMap(s_source, faceIdx, uv);
    o_color = vec4(color, 1.0);
}

`;

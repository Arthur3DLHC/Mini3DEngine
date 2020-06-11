/**
 * cubemap (texture2darray) specular filter
 * https://blog.csdn.net/i_dovelemon/article/details/79251920
 * https://blog.csdn.net/i_dovelemon/article/details/79598921
 */
export default /** glsl */`
precision lowp sampler2DArray;

#include <function_cubemap>

const float PI = 3.1415926536898;

uniform sampler2DArray      s_source;
uniform int                 u_layer;
uniform float               u_roughness;

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

float radicalInverse(uint bits) {
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10f;
}

vec2 hammersley(uint i, uint N) {
    return vec2(float(i) / float(N), radicalInverse(i));
}

vec3 importanceSamplingGGX(vec2 xi, float roughness, vec3 n) {
    float a = roughness * roughness;

    float phi = 2.0 * PI * xi.x;
    float costheta = sqrt((1.0 - xi.y) / (1.0 + (a * a - 1.0) * xi.y));
    float sintheta = sqrt(1.0 - costheta * costheta);

    vec3 h = vec3(0.0, 0.0, 0.0);
    h.x = sintheta * cos(phi);
    h.y = sintheta * sin(phi);
    h.z = costheta;

    vec3 up = abs(n.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 tx = normalize(cross(up, n));
    vec3 ty = cross(n, tx);

    return tx * h.x + ty * h.y + n * h.z;
}

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

        float ndotl = max(0, dot(n, l));
        if (ndotl > 0.0) {
            color = color + textureCubeArray(s, l, u_layer).xyz * ndotl;
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

    vec2 uv = ex_texcoord * vec2(6.0, 1.0);
    float u = floor(uv.x);
    int faceIdx = int(u);
    uv.x -= u;

    vec3 color = convolutionCubeMap(s_source, faceIdx, uv);
    o_color = vec4(color, 1.0);
}

`;

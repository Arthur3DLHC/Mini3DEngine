/**
 * cubemap (texture2darray) specular filter
 * https://blog.csdn.net/i_dovelemon/article/details/79251920
 * https://blog.csdn.net/i_dovelemon/article/details/79598921
 */
export default /** glsl */`

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

void main(void)
{
    vec3 n = vec3(0.0, 0.0, 1.0);
    float roughness = uv.y;
    float ndotv = uv.x;

    vec3 v = vec3(0.0, 0.0, 0.0);
    v.x = sqrt(1.0 - ndotv * ndotv);
    v.z = ndotv;

    float scalar = 0.0;
    float bias = 0.0;

    // Convolution
    uint samples = 1024u;
    for (uint i = 0u; i < samples; i++) {
        vec2 xi = hammersley(i, samples);
        vec3 h = importanceSamplingGGX(xi, roughness, n);
        vec3 l = 2.0 * dot(v, h) * h - v;

        float ndotl = max(0.0, l.z);
        float ndoth = max(0.0, h.z);
        float vdoth = max(0.0, dot(v, h));

        if (ndotl > 0.0) {
            float G = calcGeometrySmithIBL(n, v, l, roughness);

            float G_vis = G * vdoth / (ndotv * ndoth);
            float Fc = pow(1.0 - vdoth, 5.0);

            scalar = scalar + G_vis * (1.0 - Fc);
            bias = bias + G_vis * Fc;
        }
    }

    vec3 color = vec3(scalar, bias, 0.0);
    color = color / samples;
    o_color = vec4(color, 1.0);
}
`;
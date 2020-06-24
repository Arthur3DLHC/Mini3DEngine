/**
 * composite ssr, envmap, fog... to scene image
 */
export default /** glsl */`

#include <uniforms_view>

// uniforms
// uniform vec2 u_offset;
// uniform float u_intensity;
// uniform float u_power;

// samplers
#include <samplers_postprocess>
uniform sampler2D s_aoTex;          // for specular occlusion, will be blurred
uniform sampler2D s_reflTex;        // ssr result texture, will be blurred

#include <function_depth>
float getLinearDepth(vec2 scrUV) {
    // now only have perspective camera
    float fragDepth = texture(s_sceneDepth, scrUV).r;
    float viewZ = perspectiveDepthToViewZ(fragDepth, u_view.zRange.x, u_view.zRange.y);
    return viewZToOrthoDepth(viewZ, u_view.zRange.x, u_view.zRange.y);
}

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

void main(void) {
    // hardcode the gaussian blur weights for left top 3x3 kernels of a 5x5 kernel matrix
    // because the weights are symmertrical

    mat3 kernel = mat3(
        0.003765, 0.015019, 0.023792,
        0.015019, 0.059912, 0.094907,
        0.023792, 0.094907, 0.150342
        );
    int kernelIdx[5];
    kernelIdx[0] = kernelIdx[4] = 0;
    kernelIdx[1] = kernelIdx[3] = 1;
    kernelIdx[2] = 2;

    // 1d kernel weights, not used
    // kernel[0] = kernel[8] = 0.05;
    // kernel[1] = kernel[7] = 0.09;
    // kernel[2] = kernel[6] = 0.12;
    // kernel[3] = kernel[5] = 0.15;
    // kernel[4] = 0.16;

    vec4 sumColor = vec4(0.0);
    float sumWeight = 0.0;
    float epsilon = 0.001;

    float centerDepth = getLinearDepth(ex_texcoord);

    for(int i = 0; i < 5; i++) {
        for(int j = 0; j < 5; j++) {
            vec2 offset = vec2((float(i) - 4.0), float(j) - 4.0) * u_offset;
            vec2 uv = clamp(ex_texcoord + offset, vec2(0.0), vec2(1.0));
            float d = getLinearDepth(uv);
            int ki = kernelIdx[i];
            int kj = kernelIdx[j];
            float weight = kernel[ki][kj];
            weight *= clamp(1.0 / (epsilon + abs(d - centerDepth)), 0.0, 100.0);
            
            float ao = texture(s_aoTex, uv).r;
            vec4 refl = texture(s_reflTex, uv);
            sumColor += refl * ao * weight;
            sumWeight += weight;
        }
    }

    sumColor /= sumWeight;

    // alpha blend
    o_color = sumColor;

    // debug
    // o_color = texture(s_aoTex, ex_texcoord);
}

`;
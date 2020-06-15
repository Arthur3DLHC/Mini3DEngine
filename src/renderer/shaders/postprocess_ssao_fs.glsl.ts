/**
 * ssao effect
 */
export default /** glsl */`
#include <uniforms_view>
// todo: define uniforms
// can they be shared?
uniform vec2 u_texelSize;               // 1.0 / textureSize of depth and normal texture
uniform vec2 u_noiseTexelSize;          // 1.0 / noise texture size

// projection and invprojection matrices can be found in u_view block

uniform vec3 u_kernel[NUM_KERNELS];     // NUM_KERNELS will be defined by postprocessor.js?
uniform float u_radius;
uniform float u_power;
uniform float u_bias;
uniform float u_intensity;

uniform sampler2D s_noiseTex;
// fix me: use world or view space normal?
// output view space normal when rendering scene?
#include <samplers_postprocess>

#include <function_depth>

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

void main(void) {

}

`;
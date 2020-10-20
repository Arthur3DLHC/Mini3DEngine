/**
 * composite bloom mip results
 * https://github.com/mrdoob/three.js/blob/dev/examples/js/postprocessing/UnrealBloomPass.js
 * https://docs.unrealengine.com/latest/INT/Engine/Rendering/PostProcessEffects/Bloom/
 */
export default /** glsl */`
#define NUM_MIPS 5
uniform sampler2D s_bloomTex1;
uniform sampler2D s_bloomTex2;
uniform sampler2D s_bloomTex3;
uniform sampler2D s_bloomTex4;
uniform sampler2D s_bloomTex5;
uniform float u_intensity;
uniform float u_bloomRadius;
uniform float u_bloomFactors[NUM_MIPS];   // horiz (blurRadius * texelSize, 0.0) or vertical (0.0, blurRadius * texelSize)
uniform vec3 u_bloomTintColors[NUM_MIPS];

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

float lerpBloomFactor(float factor) {
    float mirrorFactor = 1.2 - factor;
    return mix(factor, mirrorFactor, u_bloomRadius);
}

void main(void) {
    o_color = u_intensity * ( lerpBloomFactor(u_bloomFactors[0]) * vec4(u_bloomTintColors[0], 1.0) * texture(s_bloomTex1, ex_texcoord) +
                              lerpBloomFactor(u_bloomFactors[1]) * vec4(u_bloomTintColors[1], 1.0) * texture(s_bloomTex2, ex_texcoord) +
                              lerpBloomFactor(u_bloomFactors[2]) * vec4(u_bloomTintColors[2], 1.0) * texture(s_bloomTex3, ex_texcoord) +
                              lerpBloomFactor(u_bloomFactors[3]) * vec4(u_bloomTintColors[3], 1.0) * texture(s_bloomTex4, ex_texcoord) +
                              lerpBloomFactor(u_bloomFactors[4]) * vec4(u_bloomTintColors[4], 1.0) * texture(s_bloomTex5, ex_texcoord) );
    // o_color = texture(s_source, ex_texcoord);
}

`;
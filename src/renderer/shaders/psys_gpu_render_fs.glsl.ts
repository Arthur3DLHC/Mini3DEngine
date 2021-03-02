/**
 * default shader for render particles
 * transparent or opaque self-illuminating (animating) textured particle
 * billboard or mesh
 */
export default /** glsl */`

// uniforms
uniform int u_softParticle;
uniform float u_texAnimFrames;

// samplers
uniform sampler2D s_sceneDepth;
uniform sampler2D s_texture;    // one-row texture contains animation frames

// varyings
in vec4     ex_color;           // if particle is dead, set alpha to zero then discard it in fs
in vec2     ex_texcoord0;       // for blending between two frames
in vec2     ex_texcoord1;       //
in float    ex_texMixAmount;    // mix factor between frame0 and frame1

#include <output_final>
// layout(location = 0) out vec4 o_color;

void main(void)
{
    if(ex_color.a < 0.001) {
        // may be dead particles
        discard;
    }

    FinalOutput o = defaultFinalOutput();
    // o.color = vec4(1.0);
    o.color = ex_color;

    // todo: sample texture and texture animation
    if(u_texAnimFrames > 0.0) {
        vec4 texcolor = texture(s_texture, ex_texcoord0);
        if(u_texAnimFrames > 1.0) {
            vec4 nextFrameColor = texture(s_texture, ex_texcoord1);
            texcolor = mix(texcolor, nextFrameColor, ex_texMixAmount);
        }
        o.color = ex_color * texcolor;
    }

    // todo: soft particle?

    // o_color = vec4(1.0, 1.0, 1.0, 1.0);
    outputFinal(o);
}
`;
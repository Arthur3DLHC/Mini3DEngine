/**
 * default shader for render particles
 * transparent or opaque self-illuminating (animating) textured particle
 * billboard or mesh
 */
export default /** glsl */`

#include <samplers_scene>
#include <uniforms_scene>
#include <uniforms_view>
#include <function_cluster>
#include <function_cubemap>
#include <function_get_items>
#include <function_punctual_lights>
#include <function_shadow>
#include <function_brdf_pbr>
#include <function_ibl>

// uniforms
uniform int         u_softParticle;
uniform vec3        u_texAnimSheetInfo; // xy: uv scale z: num frames per row

uniform ivec3       u_lightingInfo;   // x: enable lighting y: use normal map z: receive shadow

#include <function_particle_lighting>

// samplers
uniform sampler2D   s_sceneDepth;
uniform sampler2D   s_texture;    // texture contains animation frames
uniform sampler2D   s_normalMap;  // normalmap. must have same animation frames with texture.

// varyings
in vec4     ex_hPosition;
in vec3     ex_worldPosition;
in vec3     ex_worldNormal;
in vec3     ex_worldTangent;
in vec3     ex_worldBinormal; 
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

    // o.color = vec4(1.0);
    vec4 baseColor = ex_color;

    // sample texture and texture animation
    if(u_texAnimSheetInfo.z > 0.0) {
        vec4 texcolor = texture(s_texture, ex_texcoord0);

        // xy is cell size, if they < 1, there are multiple cells in anim sheet.
        if(u_texAnimSheetInfo.x < 1.0 || u_texAnimSheetInfo.y < 1.0) {
            vec4 nextFrameColor = texture(s_texture, ex_texcoord1);
            texcolor = mix(texcolor, nextFrameColor, ex_texMixAmount);
        }
        baseColor = ex_color * texcolor;
        // o.color = ex_color * texcolor;
    }

    // discard transparent pixels early
    if (baseColor.a < 0.001) {
        discard;
    }

    // todo: soft particle?

    FinalOutput o = defaultFinalOutput();
    o.color = baseColor;

    // todo: lighting.
    // fix me: lots of overdraw
    // todo: encapsulate as function? or add a callback function to let custom shaders to modify the color output?
    if (u_lightingInfo.x > 0) {
        // world space normal
        vec3 normal = ex_worldNormal;

        // normal map
        if (u_lightingInfo.y > 0) {
            vec3 normalTex = texture(s_normalMap, ex_texcoord0).rgb * 2.0 - vec3(1.0);
            mat3 matNormal = mat3(ex_worldTangent, ex_worldBinormal, ex_worldNormal);
            normal = matNormal * normalTex;
        }
        normal = normalize(normal);

        // use lighting function
        ParticleBRDFProperties brdfProps;
        brdfProps.worldPosition = ex_worldPosition;
        brdfProps.worldNormal = normal;
        brdfProps.hPosition = ex_hPosition;
        brdfProps.baseColor = baseColor;
        brdfProps.specular = 0.0;
        brdfProps.metallic = 0.0;
        brdfProps.roughness = 1.0;

        vec3 f_diffuse = vec3(0.0);
        vec3 f_specular = vec3(0.0);
        vec3 f0 = vec3(0.0);

        particleLighting(brdfProps, f_diffuse, f_specular, f0);

        o.color.rgb = f_diffuse + f_specular;
        o.normal = normalize((u_view.matView * vec4(normal, 0)).xyz);
        o.roughness = brdfProps.roughness;
        o.specular = f0;
    }
    // o.tag = getObjectTag();

    // o_color = vec4(1.0, 1.0, 1.0, 1.0);
    outputFinal(o);
}
`;
/**
 * liquid splat particle shader
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

    // the inverse alpha channel in ex_color is clipping reference.
    float alphaRef = 1.0 - ex_color.a;

    vec4 baseColor = vec4(ex_color.rgb, 1.0);

    // sample texture and texture animation
    if(u_texAnimSheetInfo.z > 0.0) {
        vec4 texcolor = texture(s_texture, ex_texcoord0);

        // xy is cell size, if they < 1, there are multiple cells in anim sheet.
        if(u_texAnimSheetInfo.x < 1.0 || u_texAnimSheetInfo.y < 1.0) {
            vec4 nextFrameColor = texture(s_texture, ex_texcoord1);
            texcolor = mix(texcolor, nextFrameColor, ex_texMixAmount);
        }
        baseColor *= texcolor;
        // o.color = ex_color * texcolor;
    }

    // discard transparent pixels early
    if (baseColor.a < alphaRef) {
        discard;
    }

    // is this necessary?
    baseColor.a = 1.0;

    FinalOutput o = defaultFinalOutput();
    o.color = baseColor;

    // fix me: lots of overdraw
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
        brdfProps.specular = 0.5;
        brdfProps.metallic = 0.0;
        brdfProps.roughness = 0.0;

        vec3 f_diffuse = vec3(0.0);
        vec3 f_specular = vec3(0.0);

        particleLighting(brdfProps, f_diffuse, f_specular);

        o.color.rgb = f_diffuse + f_specular;
    }

    // o_color = vec4(1.0, 1.0, 1.0, 1.0);
    outputFinal(o);
}
`;
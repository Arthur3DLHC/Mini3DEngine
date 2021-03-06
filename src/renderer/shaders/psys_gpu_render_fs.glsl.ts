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
#include <function_ibl>

// uniforms
uniform int         u_softParticle;
uniform vec3        u_texAnimSheetInfo; // xy: uv scale z: num frames per row

uniform ivec2       u_lightingInfo;   // x: enable lighting y: use normal map

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

    FinalOutput o = defaultFinalOutput();
    // o.color = vec4(1.0);
    o.color = ex_color;

    // sample texture and texture animation
    if(u_texAnimSheetInfo.z > 0.0) {
        vec4 texcolor = texture(s_texture, ex_texcoord0);

        // xy is cell size, if they < 1, there are multiple cells in anim sheet.
        if(u_texAnimSheetInfo.x < 1.0 || u_texAnimSheetInfo.y < 1.0) {
            vec4 nextFrameColor = texture(s_texture, ex_texcoord1);
            texcolor = mix(texcolor, nextFrameColor, ex_texMixAmount);
        }
        o.color = ex_color * texcolor;
    }

    // todo: soft particle?

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

        vec3 f_diffuse = vec3(0.0);

        // find cluster of this pixel
        uint cluster = clusterOfPixel(ex_hPosition);

        // indirect lighting (here or calculate in vertex shader?)
        // calculate here can use normal maps,
        // calculate in vertex shader is more efficient
        uint irrStart = 0u;
        uint irrCount = 0u;

        vec3 iblDiffuse = vec3(0.0);
        float totalWeight = 0.0;

        getIrrProbeIndicesInCluster(cluster, irrStart, irrCount);

        for (uint i = irrStart; i < irrStart + irrCount; i++) {
            uint probeIdx = getItemIndexAt(i);
            IrradianceProbe probe = u_irrProbes.probes[probeIdx];

            // todo: blend by distance to envprobe center position
            // todo: should also add radius weight: the smaller the probe, the stronger the weight.
            // https://www.xmswiki.com/wiki/SMS:Inverse_Distance_Weighted_Interpolation
            // float dist = length(probe.position - ex_worldPosition) + 0.1;
            // float distxradius = dist * probe.radius;
            // float weight = 1.0 / (distxradius * distxradius);

            // try to remove the distinct boundary when using clusters
            float dist = length(probe.position - ex_worldPosition);
            float distWeight = clamp(1.0 - dist / probe.radius, 0.0, 1.0);
            // smaller radius still get more weight?
            float radiusWeight = 1.0 / probe.radius;
            float weight = distWeight * radiusWeight;

            // debug
            // weight = 10.0;

            // IBL diffuse part
            iblDiffuse += getIBLRadianceLambertian(s_irrProbeArray, int(probeIdx), normal, o.color.rgb) * weight;
            
            totalWeight += weight;
        }
        if (totalWeight > 0.0) {
            // debug output envmap
            // o.color.rgb += reflection * 0.5 / totalWeight;
            // f_specular += iblSpecular / totalWeight;
            // f_diffuse += vec3(0.5);

            // f_diffuse += vec3(totalWeight);

            f_diffuse += iblDiffuse / totalWeight;
        }

        // punctual lighting and shadowmaps
        // do a simple diffuse lighting only? no specular; for default general smoke lighting

        o.color.rgb = f_diffuse;
    }

    // o_color = vec4(1.0, 1.0, 1.0, 1.0);
    outputFinal(o);
}
`;
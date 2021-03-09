/**
 * default shader for render particles
 * transparent or opaque self-illuminating (animating) textured particle
 * billboard or mesh
 */
export default /** glsl */`

const float M_PI = 3.141592653589793;

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

uniform ivec3       u_lightingInfo;   // x: enable lighting y: use normal map z: receive shadow

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

    // discard transparent pixels early
    if (o.color.a < 0.001) {
        discard;
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
        normal = normalize(normal);

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

            f_diffuse += iblDiffuse / totalWeight;
        }

        // punctual lighting and shadowmaps
        // fix me: lighting calculation is heavy
        // do a simple diffuse lighting only? no specular; for default general smoke lighting
        // if light is far away, do not use shadow?
        // what if the light is big?
        uint lightStart;
        uint lightCount;
        getLightIndicesInCluster(cluster, lightStart, lightCount);
        for (uint i = lightStart; i < lightStart + lightCount; i++) {
            uint lightIdx = getItemIndexAt(i);
            Light light = u_lights.lights[lightIdx];
            uint lightType = getLightType(light);
            float lightRange = getLightRange(light);

            float rangeAttenuation = 1.0;
            float spotAttenuation = 1.0;
            float shadow = 1.0;

            vec3 lightPosition = light.transform[3].xyz;
            vec3 lightDir = (light.transform * vec4(0.0, 0.0, -1.0, 0.0)).xyz;
            // vec3 lightDir = vec3(0.0, 0.0, -1.0);
            vec3 pointToLight = -lightDir;

            // todo: check light type
            // todo: optimize: check NdotL before light range?
            if (lightType == LightType_Directional) {
                // if dir light radius > 0, block out parts outside the beam
                if(lightRange > 0.0) {
                    vec3 ltop = ex_worldPosition - lightPosition;
                    vec3 perpend = ltop - dot(ltop, lightDir) * lightDir;
                    if(dot(perpend, perpend) > lightRange * lightRange) {
                        continue;
                    }
                }
            } else {
                pointToLight = lightPosition - ex_worldPosition;
                float lightDistSq = dot(pointToLight, pointToLight);
                // block out light early
                if (lightRange > 0.0 && lightDistSq > lightRange * lightRange) {
                    continue;
                }
                rangeAttenuation = getRangeAttenuation(lightRange, lightDistSq);
                if (lightType == LightType_Spot) {
                    spotAttenuation = getSpotAttenuation(pointToLight, lightDir, getLightOuterConeCos(light), getLightInnerConeCos(light));
                    // block out light early
                    if (spotAttenuation < 0.001) {
                        continue;
                    }
                }
            }
            // check NdotL early
            vec3 l = normalize(pointToLight);   // Direction from surface point to light
            float NdotL = dot(normal, l);

            if (NdotL < 0.0) {
                continue;
            }

            NdotL = min(NdotL, 1.0);

            // todo: receive shadow
            if (u_lightingInfo.z > 0 && getLightCastShadow(light)) {
                mat4 matShadow = mat4(0.0);
                vec3 shadowCoord = vec3(0.0);
                if (lightType != LightType_Point) {
                    // if spot or direction, project the pixel position to shadow map
                    matShadow = light.matShadow;
                    vec4 projPosition = matShadow * vec4(ex_worldPosition, 1.0);
                    shadowCoord = projPosition.xyz / projPosition.w;
                    // debug shadow texture
                    // float shadow = texture(s_shadowAtlas, projPosition.xy).r;
                    // f_diffuse.r += shadow;
                    // continue;
                } else {
                    // if point light, need to do a custom cube shadow map sampling
                    int faceId = 0;
                    vec4 projPosition = getPointLightShadowProjCoord(ex_worldPosition, light, faceId);
                    vec4 rect = getPointLightShadowmapRect(faceId, light);
                    // divide by w, then apply rect transform
                    projPosition.z -= 0.01;
                    shadowCoord = projPosition.xyz / projPosition.w;
                    shadowCoord = shadowCoord * vec3(rect.z * 0.5, rect.w * 0.5, 0.5)
                                            + vec3(rect.z * 0.5 + rect.x, rect.w * 0.5 + rect.y, 0.5);
                }
                shadow = shadowPCF3(s_shadowAtlas, shadowCoord);

                // vec2 offset = (dither - vec2(0.5)) / 1024.0; // shadow atlas texture size / 4
                // shadowCoord.xy += offset;
                // shadow = texture(s_shadowAtlas, shadowCoord);
                if(shadow < 0.001) {
                    continue;
                }
            }

            vec3 intensity = rangeAttenuation * spotAttenuation * light.color.rgb * shadow;
            vec3 illuminance = intensity * NdotL;

            // fix me: use F_Schlick or not?
            // because we do not add specular for default smoke-like particles, we do not need to apply F_Schlick here
            f_diffuse += illuminance * o.color.rgb / M_PI;
        }

        o.color.rgb = f_diffuse;
    }

    // o_color = vec4(1.0, 1.0, 1.0, 1.0);
    outputFinal(o);
}
`;
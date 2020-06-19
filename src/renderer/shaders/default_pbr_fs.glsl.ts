/**
 * default simple pbr shader
 * mostly from https://github.com/KhronosGroup/glTF-Sample-Viewer/
 */
export default /** glsl */`
#include <samplers_scene>
#include <uniforms_scene>
#include <uniforms_view>
#include <uniforms_object>
#include <uniforms_mtl_pbr>

#include <function_cluster>
#include <function_cubemap>
#include <function_get_items>
#include <function_punctual_lights>
#include <function_shadow>
#include <function_brdf_pbr>
#include <function_ibl>
#include <function_tonemap>

#include <output_final>
in vec4 ex_hPosition;
in vec3 ex_worldPosition;      // because all lights, decals, cubemaps, irrvols are in world space, we transform position, normal to world space.
in vec3 ex_worldNormal;
in vec4 ex_color;
in vec2 ex_texcoord;

vec3 getNormal() {
    // todo: check if normalmap have been present
    // todo: return tangent and binormal for anisotropic lighting in future
    return normalize(ex_worldNormal);
}

vec3 getBaseColor() {
    // todo: base color map
    return (u_material.baseColor * ex_color).rgb;
}

vec3 getEmissive() {
    // todo: emissive map
    return u_material.emissive.rgb;
}

vec2 getMetallicRoughness() {
    // todo: roughness matallic map
    vec2 ret = vec2(u_material.metallic, u_material.roughness);
    return clamp(ret, vec2(0.0), vec2(1.0));
}

float getOpacity() {
    return u_material.baseColor.a;
}

void main(void)
{
    FinalOutput o = defaultFinalOutput();
    // o.color = ex_color;

    vec3 n = getNormal();
    vec3 v = normalize(u_view.position - ex_worldPosition);
    float NdotV = clampedDot(n, v);

    vec3 baseColor = getBaseColor();
    vec2 metallicRoughness = getMetallicRoughness();
    float metallic = metallicRoughness.x;
    float roughness = metallicRoughness.y;

    // simple default f0
    vec3 f0 = vec3(0.04);
    // use metallic factor to lerp between default 0.04 and baseColor
    vec3 albedoColor = mix(baseColor.rgb * (vec3(1.0) - f0),  vec3(0), metallic);
    f0 = mix(vec3(0.04), baseColor.rgb, metallic);
    vec3 f90 = vec3(1.0);
    float alphaRoughness = roughness * roughness;

    vec3 f_diffuse = vec3(0.0);
    vec3 f_specular = vec3(0.0);
    vec3 f_emissive = vec3(0.0);

    // todo: decals

    uint cluster = clusterOfPixel(ex_hPosition);

    uint lightCount = getLightCountInCluster(cluster);
    for(uint i = 0u; i < lightCount; i++) {

        Light light = getLightInCluster(cluster, i);
        uint lightType = getLightType(light);

        float rangeAttenuation = 1.0;
        float spotAttenuation = 1.0;
        float shadow = 1.0;

        vec3 lightPosition = light.transform[3].xyz;
        vec3 lightDir = (light.transform * vec4(0.0, 0.0, -1.0, 0.0)).xyz;
        // vec3 lightDir = vec3(0.0, 0.0, -1.0);
        vec3 pointToLight = -lightDir;
        
        // check light type
        if (lightType != LightType_Directional) {
            pointToLight = lightPosition - ex_worldPosition;
            float lightRange = getLightRange(light);
            float lightDistSq = dot(pointToLight, pointToLight);
            // block out light early
            if (lightRange > 0.0 && lightDistSq > lightRange * lightRange) {
                continue;
            }
            rangeAttenuation = getRangeAttenuation(lightRange, lightDistSq);
        }
        if (lightType == LightType_Spot) {
            spotAttenuation = getSpotAttenuation(pointToLight, lightDir, getLightOuterConeCos(light), getLightInnerConeCos(light));
            // block out light early
            if (spotAttenuation < 0.001) {
                continue;
            }
        }

        // todo: check n dot l early? but if is subsurface material...

        // todo: test shadow
        if (getLightCastShadow(light)) {
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
                // if point light, need to du a custom cube shadow map sampling
                int faceId = 0;
                vec4 projPosition = getPointLightShadowProjCoord(ex_worldPosition, light, faceId);
                vec4 rect = getPointLightShadowmapRect(faceId, light);
                // divide by w, then apply rect transform
                projPosition.z -= 0.01;
                shadowCoord = projPosition.xyz / projPosition.w;
                shadowCoord = shadowCoord * vec3(rect.z * 0.5, rect.w * 0.5, 0.5)
                                         + vec3(rect.z * 0.5 + rect.x, rect.w * 0.5 + rect.y, 0.5);
            }
            shadow = texture(s_shadowAtlas, shadowCoord);
            if(shadow < 0.001) {
                continue;
            }
        }

        // test range attenuation
        // o.color = vec4(rangeAttenuation, rangeAttenuation, rangeAttenuation, 1.0);
        vec3 l = normalize(pointToLight);   // Direction from surface point to light
        float NdotL = clampedDot(n, l);
        // float NdotV = clampedDot(n, v);  // 前面已经算过了，与光源无关
        if (NdotL > 0.0 || NdotV > 0.0)
        {
            vec3 intensity = rangeAttenuation * spotAttenuation * light.color.rgb * shadow;
            // these values may be used by sheen, clearcoat, subsurface or other effets
            // if so, they may be need to move outside
            vec3 h = normalize(l + v);          // Direction of the vector between l and v, called halfway vector
            float NdotH = clampedDot(n, h);
            float LdotH = clampedDot(l, h);
            float VdotH = clampedDot(v, h);
            vec3 illuminance = intensity * NdotL;
            vec3 F = F_Schlick(f0, f90, VdotH);

            f_diffuse += illuminance * BRDF_lambertian(F, albedoColor);
            f_specular += illuminance * BRDF_specularGGX(F, alphaRoughness, NdotL, NdotV, NdotH);
        }

        // test color
        // o.color += light.color;
    }

    f_emissive = getEmissive();



    // test normal
    // vec3 normal = normalize(ex_worldNormal);
    // o.color.xyz = (normal + vec3(1.0,1.0,1.0)) * 0.5;
    // o.color.w = 1.0;

    // test texcoord
    // o.color = vec4(ex_texcoord, 1, 1);

    // todo: irradiance volumes

    // todo: env maps: image based lighting
    uint envmapStart = 0u;
    uint envmapCount = 0u;
    // float cubeUVScale = 1.0 / 6.0;

    vec3 iblDiffuse = vec3(0.0);
    // reflection vector, in world space
    vec3 reflV = reflect(-v, n);
    vec3 iblSpecular = vec3(0.0);
    float totalWeight = 0.0;

    getEnvProbeIndicesInCluster(cluster, envmapStart, envmapCount);
    for (uint i = envmapStart; i < envmapStart + envmapCount; i++) {
        uint probeIdx = getItemIndexAt(i);
        EnvProbe probe = u_envProbes.probes[probeIdx];

        // todo: blend by distance to envprobe center position
        // todo: should also add radius weight: the smaller the probe, the stronger the weight.
        // https://www.xmswiki.com/wiki/SMS:Inverse_Distance_Weighted_Interpolation
        float dist = length(probe.position - ex_worldPosition) + 0.1;
        float distxradius = dist * probe.radius;
        float weight = 1.0 / (distxradius * distxradius);

        // todo: calc cubemap texcoord
        // int faceId = 0;
        // vec3 cubeTexCoord = vec3(getCubemapTexcoord(reflV, faceId), float(i - envmapStart));
        
        // cubeTexCoord.x = cubeTexCoord.x * cubeUVScale + float(faceId) * cubeUVScale;

        // sample envmap, 
        // vec4 envmap = texture(s_envMapArray, cubeTexCoord);
        // IBL diffuse part
        int layer = int(i - envmapStart);
        iblDiffuse += getIBLRadianceLambertian(s_envMapArray, layer, n, albedoColor) * weight;
        
        // todo: IBL specular part
        vec3 ld = textureCubeArrayLod(s_envMapArray, reflV, layer, roughness * MAX_SPECULAR_MIP_LEVEL).rgb;
        vec2 dfg = texture(s_specularDFG, vec2(NdotV, roughness)).rg;
        iblSpecular += ld * (f0 * dfg.x + dfg.y) * weight;
        // vec4 envmap = textureCubeArray(s_envMapArray, reflV, int(i - envmapStart));
        // reflection += envmap.rgb * weight;
        
        totalWeight += weight;

        // todo: sample different levels and filter by roughness
    }
    // debug output envmap
    if (totalWeight > 0.0) {
        // o.color.rgb += reflection * 0.5 / totalWeight;
        f_diffuse += iblDiffuse / totalWeight;
        f_specular += iblSpecular / totalWeight;
    }
    // todo: opacity for transparent surfaces;
    // todo: tone mapping? linear space to sRGB space?
    vec3 color = f_diffuse + f_specular + f_emissive;
    color = ACESToneMapping(color, 1.0);
    o.color = vec4(color, getOpacity());
    o.normal = (u_view.matView * vec4(n, 0)).xyz;  // output world normal or view normal?
    o.roughness = roughness;
    o.specular = f0;

    outputFinal(o);
}
`;
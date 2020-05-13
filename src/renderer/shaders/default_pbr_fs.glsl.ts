/**
 * default simple pbr shader
 * mostly from https://github.com/KhronosGroup/glTF-Sample-Viewer/
 */
export default /** glsl */`
#include <uniforms_scene>
#include <uniforms_view>
#include <uniforms_object>
#include <uniforms_mtl_pbr>

#include <function_cluster>
#include <function_get_lights>
#include <function_punctual_lights>
#include <function_brdf_pbr>

#include <output_final>
in vec4 ex_hPosition;
in vec3 ex_worldPosition;      // because all lights, decals, cubemaps, irrvols are in world space, we transform position, normal to world space.
in vec3 ex_worldNormal;
in vec4 ex_color;
in vec2 ex_texcoord;

vec3 getNormal() {
    // todo: check if normalmap have been present
    // todo: return tangent and binormal
    return normalize(ex_worldNormal);
}

vec3 getBaseColor() {
    // todo: base color map
    return (u_material.baseColor * ex_color).rgb;
}

vec2 getMetallicRoughness() {
    // todo: roughness matallic map
    vec2 ret = vec2(u_material.metallic, u_material.roughness);
    return clamp(ret, vec2(0.0), vec2(1.0));
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
        vec3 lightPosition = light.transform[3].xyz;
        vec3 lightDir = (light.transform * vec4(0.0, 0.0, -1.0, 0.0)).xyz;
        // vec3 lightDir = vec3(0.0, 0.0, -1.0);
        vec3 pointToLight = -lightDir;
        
        // todo: check light type
        if (lightType != LightType_Directional) {
            pointToLight = lightPosition - ex_worldPosition;
            rangeAttenuation = getRangeAttenuation(getLightRadius(light), length(pointToLight));
        }
        if (lightType == LightType_Spot) {
            spotAttenuation = getSpotAttenuation(pointToLight, lightDir, getLightOuterConeCos(light), getLightInnerConeCos(light));
        }

        // test range attenuation
        // o.color = vec4(rangeAttenuation, rangeAttenuation, rangeAttenuation, 1.0);

        vec3 intensity = rangeAttenuation * spotAttenuation * light.color.rgb;

        vec3 l = normalize(pointToLight);   // Direction from surface point to light
        vec3 h = normalize(l + v);          // Direction of the vector between l and v, called halfway vector
        float NdotL = clampedDot(n, l);
        // float NdotV = clampedDot(n, v);  // 前面已经算过了，与光源无关
        float NdotH = clampedDot(n, h);
        float LdotH = clampedDot(l, h);
        float VdotH = clampedDot(v, h);

        if (NdotL > 0.0 || NdotV > 0.0)
        {
            // f_diffuse += albedoColor;
            // f_diffuse += vec3(VdotH);
            vec3 illuminance = intensity * NdotL;

            f_diffuse += illuminance * BRDF_lambertian(f0, f90, albedoColor, VdotH);
            f_specular += illuminance * BRDF_specularGGX(f0, f90, alphaRoughness, VdotH, NdotL, NdotV, NdotH);
        }

        // test color
        // o.color += light.color;
    }

    o.color = vec4(f_diffuse + f_specular, 1);

    // test normal
    // vec3 normal = normalize(ex_worldNormal);
    // o.color.xyz = (normal + vec3(1.0,1.0,1.0)) * 0.5;
    // o.color.w = 1.0;

    // test texcoord
    // o.color = vec4(ex_texcoord, 1, 1);

    // todo: irradiance volumes

    // todo: env maps: image based lighting

    outputFinal(o);
}
`;
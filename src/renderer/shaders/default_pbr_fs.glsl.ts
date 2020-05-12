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
#include <function_shading_pbr>

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

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
vec3 F_Schlick(vec3 f0, vec3 f90, float VdotH)
{
    return f0 + (f90 - f0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);
}

//https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
vec3 BRDF_lambertian(vec3 f0, vec3 f90, vec3 diffuseColor, float VdotH)
{
    // see https://seblagarde.wordpress.com/2012/01/08/pi-or-not-to-pi-in-game-lighting-equation/
    // 假设一束光线照射表面上一点 p，由于漫反射出的光线是近似均匀分布在以 p 为中心的半球面上的，所以这些光线的能量在
    // 这个半球上的总和应该小于等于这一点漫反射出的光的总能量，而相机在透过半球面观察这个点时，则只会取半球表面上和这个点面积
    // 相近的一小部分。在数学上，半球积分系数为 π，也就是P点和半球上一点能量的比例为 π，所以为了求出通过半球到达相机的
    // 光的能量，需要用 p 点漫反射的总能量除以 π
    return (1.0 - F_Schlick(f0, f90, VdotH)) * (diffuseColor / M_PI);
}

void main(void)
{
    FinalOutput o = defaultFinalOutput();
    // o.color = ex_color;

    vec3 n = getNormal();
    vec3 v = normalize(u_view.position - ex_worldPosition);
    float NdotV = clampedDot(n, v);

    vec3 baseColor = getBaseColor();

    // simple default f0
    vec3 f0 = vec3(0.04);
    // use metallic factor to lerp between default 0.04 and baseColor
    vec3 albedoColor = mix(baseColor.rgb * (vec3(1.0) - f0),  vec3(0), u_material.metallic);
    f0 = mix(vec3(0.04), baseColor.rgb, u_material.metallic);
    vec3 f90 = vec3(1.0);

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
        vec3 lightDir = (light.transform * vec4(0.0, 0.0, -1.0, 1.0)).xyz;
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
            f_specular += illuminance * 
        }

        // test color
        // o.color += light.color;
    }

    o.color = vec4(f_diffuse, 1);

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
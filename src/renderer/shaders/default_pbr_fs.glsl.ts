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

#include <output_final>
in vec4 ex_hPosition;
in vec3 ex_worldPosition;      // because all lights, decals, cubemaps, irrvols are in world space, we transform position, normal to world space.
in vec3 ex_worldNormal;
in vec4 ex_color;
in vec2 ex_texcoord;

vec3 getNormal() {
    // todo: check if normalmap have been present
    return normalize(ex_worldNormal);
}

void main(void)
{
    FinalOutput o = defaultFinalOutput();
    // o.color = ex_color;

    // todo: decals

    uint cluster = clusterOfPixel(ex_hPosition);
    uint lightCount = getLightCountInCluster(cluster);
    for(uint i = 0u; i < lightCount; i++) {
        Light light = getLightInCluster(cluster, i);
        uint lightType = getLightType(light);
        float rangeAttenuation = 1.0;
        float spotAttenuation = 1.0;
        vec3 lightPosition = light.transform[3].xyz;
        vec3 pointToLight = (light.transform * vec4(0.0, 0.0, 1.0, 1.0)).xyz;    // light look at -z, so point to light use +z
        // todo: check light type
        if (lightType != LightType_Directional) {
            pointToLight = lightPosition - ex_worldPosition;
            rangeAttenuation = getRangeAttenuation(getLightRadius(light), length(pointToLight));
        }
        if (lightType == LightType_Spot) {
            // todo: use penumbra
            // spotAttenuation = getSpotAttenuation()
        }

        // test range attenuation

        o.color = vec4(rangeAttenuation, rangeAttenuation, rangeAttenuation, 1.0);

        // test color
        // o.color += light.color;
    }

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
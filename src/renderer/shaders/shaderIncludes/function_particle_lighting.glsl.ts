/**
 * particle system lighting functions
 */
export default /** glsl */`

struct ParticleBRDFProperties {
    vec3 worldPosition;
    vec3 worldNormal;
    vec4 hPosition;
    vec3 baseColor;
    float specular;
    float metallic;
    float roughness;
}

void particleLighting(ParticleBRDFProperties brdfProps, out vec3 f_diffuse, out vec3 f_specular) {
    // todo: control whether calc specular or not
    // using specluar amount, metallic param?

    f_diffuse = vec3(0.0);
    f_specular = vec3(0.0);

    // intermediate params
    // simple default f0
    vec3 f0 = vec3(0.08) * brdfProps.specular;
    // use metallic factor to lerp between default 0.04 and baseColor
    vec3 albedoColor = mix(brdfProps.baseColor.rgb * (vec3(1.0) - f0),  vec3(0), brdfProps.metallic);
    f0 = mix(f0, brdfProps.baseColor.rgb, brdfProps.metallic);
    vec3 f90 = vec3(1.0);
    float alphaRoughness = brdfProps.roughness * brdfProps.roughness;

    // find cluster of this pixel
    uint cluster = clusterOfPixel(brdfProps.hPosition);

    // indirect lighting
    // irradiance probes
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
        // float dist = length(probe.position - brdfProps.worldPosition) + 0.1;
        // float distxradius = dist * probe.radius;
        // float weight = 1.0 / (distxradius * distxradius);

        // try to remove the distinct boundary when using clusters
        float dist = length(probe.position - brdfProps.worldPosition);
        float distWeight = clamp(1.0 - dist / probe.radius, 0.0, 1.0);
        // smaller radius still get more weight?
        float radiusWeight = 1.0 / probe.radius;
        float weight = distWeight * radiusWeight;

        // debug
        // weight = 10.0;

        // IBL diffuse part
        iblDiffuse += getIBLRadianceLambertian(s_irrProbeArray, int(probeIdx), brdfProps.normal, brdfProps.albedo.rgb) * weight;
        
        totalWeight += weight;
    }
    if (totalWeight > 0.0) {
        f_diffuse += iblDiffuse / totalWeight;
    }

    // todo: reflect probes?
    // if is opaque pixel, do not need to calculate reflection, because the composite postprocess will compute it according to scene depth.

    // punctual lights
    //     diffuse lighting
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
                vec3 ltop = brdfProps.worldPosition - lightPosition;
                vec3 perpend = ltop - dot(ltop, lightDir) * lightDir;
                if(dot(perpend, perpend) > lightRange * lightRange) {
                    continue;
                }
            }
        } else {
            pointToLight = lightPosition - brdfProps.worldPosition;
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
        float NdotL = dot(brdfProps.normal, l);

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
                vec4 projPosition = matShadow * vec4(brdfProps.worldPosition, 1.0);
                shadowCoord = projPosition.xyz / projPosition.w;
                // debug shadow texture
                // float shadow = texture(s_shadowAtlas, projPosition.xy).r;
                // f_diffuse.r += shadow;
                // continue;
            } else {
                // if point light, need to do a custom cube shadow map sampling
                int faceId = 0;
                vec4 projPosition = getPointLightShadowProjCoord(brdfProps.worldPosition, light, faceId);
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

        // todo: if have specular part, use F_Schlick
        vec3 F = vec3(0.0);

        f_diffuse += illuminance * BRDF_lambertian(F, albedoColor);
        // specular lighting
    }
}
`;
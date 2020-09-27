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
#include <function_subsurface>
#include <function_brdf_pbr>
#include <function_ibl>
#include <function_tonemap>

#include <output_final>
in vec4 ex_hPosition;
in vec3 ex_worldPosition;      // because all lights, decals, cubemaps, irrvols are in world space, we transform position, normal to world space.
in vec3 ex_worldNormal;
in vec4 ex_color;
in vec2 ex_texcoord;

vec3 getNormal(vec3 v) {
    // todo: check if normalmap have been present
    // todo: return tangent and binormal for anisotropic lighting in future
    vec3 normal = normalize(ex_worldNormal);
    if(u_material.normalMapAmount > 0.0) {
        // todo: check are there tangents in vertex data?
        // different vertex format use different shader?

        // for now, always calculate tangent and binormal by derivative functions
        // http://hacksoflife.blogspot.com/2009/11/per-pixel-tangent-space-normal-mapping.html
        // and
        // https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/master/src/shaders/pbr.frag
        // getNormalInfo() function

        vec3 uv = vec3(ex_texcoord, 0.0);
        vec3 uv_dx = dFdx(uv);
        vec3 uv_dy = dFdy(uv);

        vec3 t_ = (uv_dy.t * dFdx(ex_worldPosition) - uv_dx.t * dFdy(ex_worldPosition)) /
                    (uv_dx.s * uv_dy.t - uv_dy.s * uv_dx.t);

        vec3 n, t, b, ng;

        //ng = normalize(ex_worldNormal);
        ng = normal;
        t = normalize(t_ - ng * dot(ng, t_));
        b = cross(ng, t);

        // For a back-facing surface, the tangential basis vectors are negated.
        float facing = step(0.0, dot(v, ng)) * 2.0 - 1.0;
        t *= facing;
        b *= facing;
        ng *= facing;

        // todo: anisoptry
        // todo: normal map scale; use u_material.normalMapAmount?
        vec3 texn = texture(s_normalMap, ex_texcoord).rgb * 2.0 - vec3(1.0);
        texn *= vec3(u_material.normalMapAmount, u_material.normalMapAmount, 1.0);
        texn = mat3(t, b, ng) * normalize(texn);
        normal = texn;
        // normal = mix(normal, texn, u_material.normalMapAmount);
    }
    return normal;
}

vec3 getBaseColor() {
    // fix me: according to Khronos group gltf file specification,
    // should multiply the texColor by baseColor, not mix
    vec4 texColor = texture(s_baseColorMap, ex_texcoord);
    return (mix(u_material.baseColor, texColor, u_material.colorMapAmount) * ex_color).rgb;
}

vec3 getEmissive() {
    // todo: emissive map
    vec3 ret = u_material.emissive.rgb;
    if(u_material.emissiveMapAmount > 0.0) {
        vec3 texColor = texture(s_emissiveMap, ex_texcoord).rgb;
        ret = mix(ret, texColor, u_material.emissiveMapAmount);
    }
    return ret;
}

float getSpecular() {
    return u_material.specular;
}

vec2 getMetallicRoughness() {
    // todo: roughness matallic map
    vec2 ret = vec2(u_material.metallic, u_material.roughness);
    if(u_material.metallicMapAmount + u_material.roughnessMapAmount > 0.001) {
        vec2 texColor = texture(s_metallicRoughnessMap, ex_texcoord).rg;
        ret = mix(ret, texColor, vec2(u_material.metallicMapAmount, u_material.roughnessMapAmount));
    }
    return clamp(ret, vec2(0.0), vec2(1.0));
}

float getOpacity() {
    float texOp = texture(s_baseColorMap, ex_texcoord).a;
    return mix(u_material.baseColor.a, texOp, u_material.colorMapAmount);
}

// dither offset for shadowmap
// need to calculate screen space uv?
// fix me: is it better to use a 4x4 texture? only need to do 1 texture sampling.
vec2 getDither() {
    vec2 scrUV = ex_hPosition.xy / ex_hPosition.w * vec2(0.5) + vec2(0.5);
    uvec2 scrXY = uvec2(scrUV * u_view.viewport.zw);
    uvec2 ditherIdx = scrXY % uvec2(4u, 4u);
    vec2 dither = vec2(u_ditherPattern.randX[ditherIdx.x][ditherIdx.y], u_ditherPattern.randY[ditherIdx.x][ditherIdx.y]);
    return dither;
}

void main(void)
{
    FinalOutput o = defaultFinalOutput();
    // o.color = ex_color;

    vec3 v = normalize(u_view.position - ex_worldPosition);
    vec3 n = getNormal(v);
    float NdotV = clampedDot(n, v);

    vec3 baseColor = getBaseColor();
    vec2 metallicRoughness = getMetallicRoughness();
    float metallic = metallicRoughness.x;
    float roughness = metallicRoughness.y;

    // fix me: subsurface amount and color use textures?
    float curvature = 0.0;
    if(u_material.subsurface > 0.0) {
        // fix me: using position and normal, the curvature is too blocky
        curvature = 0.2;
        // curvature = calcCurvature(n, ex_worldPosition);
    }

    // vec2 dither = getDither();

    // simple default f0
    vec3 f0 = vec3(0.08) * getSpecular();
    // use metallic factor to lerp between default 0.04 and baseColor
    vec3 albedoColor = mix(baseColor.rgb * (vec3(1.0) - f0),  vec3(0), metallic);
    f0 = mix(f0, baseColor.rgb, metallic);
    vec3 f90 = vec3(1.0);
    float alphaRoughness = roughness * roughness;

    vec3 f_diffuse = vec3(0.0);
    vec3 f_subsurface = vec3(0.0);
    vec3 f_specular = vec3(0.0);
    vec3 f_emissive = vec3(0.0);

    // todo: decals
    vec4 ndc = ex_hPosition / ex_hPosition.w;
    uint cluster = clusterOfPixel(ndc);

     // todo: irradiance probes

    // todo: env maps: image based lighting
    uint irrStart = 0u;
    uint irrCount = 0u;
    // float cubeUVScale = 1.0 / 6.0;

    vec3 iblDiffuse = vec3(0.0);
    float totalWeight = 0.0;

    // ambient light: irradiance probes
    getIrrProbeIndicesInCluster(cluster, irrStart, irrCount);
    for (uint i = irrStart; i < irrStart + irrCount; i++) {
        uint probeIdx = getItemIndexAt(i);
        IrradianceProbe probe = u_irrProbes.probes[probeIdx];

        // todo: blend by distance to envprobe center position
        // todo: should also add radius weight: the smaller the probe, the stronger the weight.
        // https://www.xmswiki.com/wiki/SMS:Inverse_Distance_Weighted_Interpolation
        float dist = length(probe.position - ex_worldPosition) + 0.1;
        float distxradius = dist * probe.radius;
        float weight = 1.0 / (distxradius * distxradius);

        // IBL diffuse part
        // todo: simple subsurface?
        iblDiffuse += getIBLRadianceLambertian(s_irrProbeArray, int(probeIdx), n, albedoColor) * weight;
        
        totalWeight += weight;
    }
    if (totalWeight > 0.0) {
        // debug output envmap
        // o.color.rgb += reflection * 0.5 / totalWeight;
        // f_specular += iblSpecular / totalWeight;
        // f_diffuse += vec3(0.5);

        f_diffuse += iblDiffuse / totalWeight;
    }

    uint lightCount = getLightCountInCluster(cluster);
    for(uint i = 0u; i < lightCount; i++) {

        Light light = getLightInCluster(cluster, i);
        uint lightType = getLightType(light);
        float lightRange = getLightRange(light);

        float rangeAttenuation = 1.0;
        float spotAttenuation = 1.0;
        float shadow = 1.0;

        vec3 lightPosition = light.transform[3].xyz;
        vec3 lightDir = (light.transform * vec4(0.0, 0.0, -1.0, 0.0)).xyz;
        // vec3 lightDir = vec3(0.0, 0.0, -1.0);
        vec3 pointToLight = -lightDir;
        
        // check light type
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

        // todo: check n dot l early? but if is subsurface material...
        // todo: if use subsurface scattering, give the shadow a bigger bias?

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
            if(shadow < 0.001 && u_material.subsurface < 0.01) {
                continue;
            }
        }

        // test range attenuation
        // o.color = vec4(rangeAttenuation, rangeAttenuation, rangeAttenuation, 1.0);
        vec3 l = normalize(pointToLight);   // Direction from surface point to light

        // do not clamp, because we need to calculate subsurface scattering.
        // float NdotL = clampedDot(n, l);
        float NdotL = dot(n, l);

        vec3 intensity = rangeAttenuation * spotAttenuation * light.color.rgb;// * shadow;

        // todo: if subsurface > 0, sample subsurface strength from subsurface scattering BRDF texture
        // todo: test the new simple subsurface scattering function
        // 
        // vec4 subsuf = vec4(0.0);
        if(u_material.subsurface > 0.0) {
            // TODO: 根据 ndotl 和 curvature 取样 subsurface BRDF texture
            // vec3 subsuf = subsurfaceScattering(NdotL, curvature, u_material.subsurfaceColor, u_material.subsurface);
            // f_diffuse += subsuf * intensity;

            // subsuf = subsurfaceScattering(NdotL, curvature, u_material.subsurfaceColor, u_material.subsurface);
            // f_diffuse += subsuf.rgb * subsuf.a * intensity;
            f_subsurface += intensity * subsurfaceRadiance(n, v, l, u_material.subsurface, u_material.subsurfaceRadius, u_material.subsurfacePower, u_material.subsurfaceColor, u_material.subsurfaceThickness);
        }

        // float NdotV = clampedDot(n, v);  // 前面已经算过了，与光源无关
        if (NdotL > 0.0 || NdotV > 0.0)
        {
            NdotL = clamp(NdotL, 0.0, 1.0);
            // apply shadow while diffuse?
            intensity *= shadow;

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

   
    // todo: opacity for transparent surfaces;
    // todo: tone mapping? linear space to sRGB space?
    vec3 color = f_diffuse + f_subsurface + f_specular + f_emissive;
    // put tone mapping in post process
    // color = ACESToneMapping(color, 1.0);

    o.color = vec4(color, getOpacity());
    // o.color = vec4(curvature, curvature, curvature, getOpacity());
    o.normal = (u_view.matView * vec4(n, 0)).xyz;  // output world normal or view normal?
    o.roughness = roughness;
    o.specular = f0;

    outputFinal(o);
}
`;
/**
 * composite ssr, envmap, fog... to scene image
 */
export default /** glsl */`

#include <uniforms_scene>
#include <uniforms_view>

// uniforms
uniform vec2 u_offset;
// uniform float u_intensity;
// uniform float u_power;

// samplers
#include <samplers_scene>
#include <samplers_postprocess>
uniform sampler2D s_aoTex;          // for specular occlusion, will be blurred
uniform sampler2D s_reflTex;        // ssr result texture, will be blurred

#include <function_cluster>
#include <function_get_items>
#include <function_brdf_pbr>
#include <function_depth>
#include <function_cubemap>
#include <function_ibl>

float getLinearDepth(vec2 scrUV) {
    // now only have perspective camera
    float fragDepth = texture(s_sceneDepth, scrUV).r;
    float viewZ = perspectiveDepthToViewZ(fragDepth, u_view.zRange.x, u_view.zRange.y);
    return viewZToOrthoDepth(viewZ, u_view.zRange.x, u_view.zRange.y);
}

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

void main(void) {
    // hardcode the gaussian blur weights for left top 3x3 kernels of a 5x5 kernel matrix
    // because the weights are symmertrical
        mat3 kernel = mat3(
        0.003765, 0.015019, 0.023792,
        0.015019, 0.059912, 0.094907,
        0.023792, 0.094907, 0.150342
        );
    int kernelIdx[5];
    kernelIdx[0] = kernelIdx[4] = 0;
    kernelIdx[1] = kernelIdx[3] = 1;
    kernelIdx[2] = 2;

    // 1d kernel weights, not used
    // kernel[0] = kernel[8] = 0.05;
    // kernel[1] = kernel[7] = 0.09;
    // kernel[2] = kernel[6] = 0.12;
    // kernel[3] = kernel[5] = 0.15;
    // kernel[4] = 0.16;

    vec4 specRough = texture(s_sceneSpecRough, ex_texcoord);
    vec3 f0 = specRough.rgb;
    float roughness = specRough.a;
    vec3 f90 = vec3(1.0);

    vec4 sumColor = vec4(0.0);
    float sumWeight = 0.0;
    float epsilon = 0.001;

    float centerDepth = getLinearDepth(ex_texcoord);

    for(int i = 0; i < 5; i++) {
        for(int j = 0; j < 5; j++) {
            // todo: scale the blur radius by roughness?
            vec2 offset = vec2((float(i) - 4.0), float(j) - 4.0) * u_offset * (1.0 + roughness * 2.0);
            vec2 uv = clamp(ex_texcoord + offset, vec2(0.0), vec2(1.0));
            float d = getLinearDepth(uv);
            int ki = kernelIdx[i];
            int kj = kernelIdx[j];
            float weight = kernel[ki][kj];
            weight *= clamp(1.0 / (epsilon + abs(d - centerDepth)), 0.0, 100.0);
            
            float ao = texture(s_aoTex, uv).r;
            vec4 refl = texture(s_reflTex, uv);
            sumColor += refl * ao * weight;
            sumWeight += weight;
        }
    }

    sumColor /= sumWeight;

    vec4 projectedPos = vec4(ex_texcoord * 2.0 - 1.0, texture(s_sceneDepth, ex_texcoord).r * 2.0 - 1.0, 1.0);
    uint cluster = clusterOfPixel(projectedPos);
    // Position in view
    vec4 viewPos = u_view.matInvProj * projectedPos;
    // todo: handle orthographic
    viewPos /= viewPos.w;

    vec3 worldPos = (u_view.matInvView * viewPos).xyz;

    // calculate world space reflection vector
    vec3 v = normalize((u_view.matInvView * vec4(viewPos.xyz, 0.0)).xyz);    // world space
    vec3 n = getSceneNormal(ex_texcoord);       // world space
    vec3 reflV = reflect(v, n);
    float NdotV = dot(n, v);



    // todo: calculate fresnel factor by f0, v and n
    // no light vector and half vector, so use n dot v
    vec3 F = F_Schlick(f0, f90, NdotV);
    // vec3 F = F_Schlick(f0, f90, VdotH);

    sumColor.rgb *= F;

    if(sumColor.a < 0.95) {
        // todo: calculate pixel world position
        // NDC


        // select cubemaps by pixel position
        uint envmapStart = 0u;
        uint envmapCount = 0u;

        getEnvProbeIndicesInCluster(cluster, envmapStart, envmapCount);
       
        // only calculate envmap specular reflection here.
        vec3 iblSpecular = vec3(0.0);
        float totalWeight = 0.0;

        for (uint i = envmapStart; i < envmapStart + envmapCount; i++) {
            uint probeIdx = getItemIndexAt(i);
            EnvProbe probe = u_envProbes.probes[probeIdx];

            // blend by distance to envprobe center position
            // should also add radius weight: the smaller the probe, the stronger the weight.
            // https://www.xmswiki.com/wiki/SMS:Inverse_Distance_Weighted_Interpolation
            float dist = length(probe.position - worldPos) + 0.1;
            float distxradius = dist * probe.radius;
            float weight = 1.0 / (distxradius * distxradius);

            int layer = int(i - envmapStart);
            
            // IBL specular part
            vec3 ld = textureCubeArrayLod(s_envMapArray, reflV, layer, roughness * MAX_SPECULAR_MIP_LEVEL).rgb;
            vec2 dfg = texture(s_specularDFG, vec2(NdotV, roughness)).rg;
            iblSpecular += ld * (f0 * dfg.x + dfg.y) * weight;
            // vec4 envmap = textureCubeArray(s_envMapArray, reflV, int(i - envmapStart));
            // reflection += envmap.rgb * weight;
            
            totalWeight += weight;
        }
        // debug output envmap
        if (totalWeight > 0.0) {
            iblSpecular /= totalWeight;
            iblSpecular = max(iblSpecular, vec3(0.0));

            // blend cubemap with ssr color, by ssr alpha (view fadeout and edge fadeout)
            sumColor.rgb = mix(iblSpecular, sumColor.rgb, sumColor.a);
        }
        // sumColor.rgb = n * 0.5 + vec3(0.5);
    }
    // fix me: test add blend?
    // sumColor.a = (f0.r + f0.g + f0.b) * 0.33333;
    o_color = vec4(sumColor.rgb, 0.0);
    // o_color = vec4(1.0, 0.0, 0.0, 1.0);
}

`;
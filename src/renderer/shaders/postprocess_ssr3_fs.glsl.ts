/*
 * based on https://github.com/BabylonJS/Babylon.js/blob/master/src/Shaders/screenSpaceReflection.fragment.fx
 * uses screen space ray march
 * modified to fit my post process samplers layout
 */
export default /** glsl */`

// uniform sampler2D gFinalImage;
// uniform sampler2D gPosition;
// uniform sampler2D gNormal;
// uniform sampler2D gExtraComponents;
// uniform sampler2D ColorBuffer;

#define ENABLE_SMOOTH_REFLECTIONS

#include <uniforms_view>
#include <samplers_postprocess>     // s_sceneColor contains prev frame image
#include <function_depth>

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

// use const first to debug, then use uniforms later
uniform float threshold;// = 0.4; //1.2;
uniform float step;// = 0.15;
// const float minRayStep = 0.1;
uniform int maxSteps;// = 40;
uniform int numBinarySearchSteps;// = 5;
uniform float reflectionSpecularFalloffExponent;// = 3.0;
uniform float roughnessFactor;// = 1.0;
uniform float minGlossiness;// = 0.1;
uniform float strength;// = 1.0;

// Structs
struct ReflectionInfo {
    vec3 color;
    vec4 coords;
};

/**
 * According to specular, see https://en.wikipedia.org/wiki/Schlick%27s_approximation
 */
vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

/**
 * Once the pixel's coordinates has been found, let's adjust (smooth) a little bit
 * by sampling multiple reflection pixels. (binary search)
 */
ReflectionInfo smoothReflectionInfo(vec3 dir, vec3 hitCoord)
{
    ReflectionInfo info;
    info.color = vec3(0.0);

    vec4 projectedCoord;
    float sampledDepth;

    for(int i = 0; i < numBinarySearchSteps; i++)
    {
        projectedCoord = u_view.matProj * vec4(hitCoord, 1.0);
        projectedCoord.xy /= projectedCoord.w;
		projectedCoord.xy = 0.5 * projectedCoord.xy + vec2(0.5);
 
         // view space z
        sampledDepth = perspectiveDepthToViewZ(texture(s_sceneDepth, projectedCoord.xy).r, u_view.zRange.x, u_view.zRange.y);

        // sampledDepth = (view * texture(positionSampler, projectedCoord.xy)).z;

        // hitCoord is in view space
        float depth = hitCoord.z - sampledDepth;

        dir *= 0.5;
        if(depth > 0.0)
            hitCoord += dir;
        else
            hitCoord -= dir;

        info.color += texture(s_sceneColor, projectedCoord.xy).rgb;
    }

    projectedCoord = u_view.matProj * vec4(hitCoord, 1.0);
    projectedCoord.xy /= projectedCoord.w;
	projectedCoord.xy = 0.5 * projectedCoord.xy + vec2(0.5);
 
    // Merge colors
    info.coords = vec4(projectedCoord.xy, sampledDepth, 1.0);
    info.color += texture(s_sceneColor, projectedCoord.xy).rgb;
    info.color /= float(numBinarySearchSteps + 1);
    return info;
}

ReflectionInfo raytraceScr(vec3 rayStartScr, vec3 rayEndScr,
                            float jitter)
{

    // inverse Z to enable linear interpolation
    // todo: need not to inverse, because the depth map is not linear viewspace z but device z
    vec3 dirScr = rayEndScr - rayStartScr;

    float lengthScr = length(dirScr.xy);

    lengthScr = max(0.001, lengthScr);

    dirScr /= lengthScr;
    rayEndScr = rayStartScr + dirScr;

    float steps = float(maxSteps);
    
    float stepLength = 1.0 / steps;
    vec3 jitterOffset = dirScr * stepLength * jitter;

    rayStartScr += jitterOffset;
    rayEndScr += jitterOffset;

    float rayLastZ = rayStartScr.z;
	float stepZView = abs(rayEndScr.z - rayStartScr.z) / steps;

    for(float i = 0.01; i <= steps; i++)
    {
        float t = i / steps;

        vec3 sampleScr = rayStartScr + dirScr * t;

        vec2 uv = sampleScr.xy;

		if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) break;;

		if (sampleScr.z > 1.0) break;

        float sceneZ = texture(s_sceneDepth, uv).r;
    
        // magic number from UE SSRTRayCast.ush
		// float stepZScr = abs(rayZ - rayLastZ);
		// float compTolerance = max(stepZScr, stepZView) * 5;

        if (sampleScr.z > sceneZ)
        // && rayZ < sceneZ + compTolerance)
        {
            // binary search
            stepLength *= 0.5;
            sampleScr -= dirScr * stepLength;

            for (int j = 0; j < numBinarySearchSteps; j++)
            {
				uv = sampleScr.xy;
                sceneZ = texture(s_sceneDepth, uv).r;
                stepLength *= 0.5;
                if (sampleScr.z > sceneZ)
                {
                    sampleScr -= dirScr * stepLength;
                }
                else
                {
                    sampleScr += dirScr * stepLength;
                }
            }
            ReflectionInfo info;
            info.color = texture(s_sceneColor, sampleScr.xy).rgb;
            info.coords = vec4(sampleScr, 0.0);
            return info;
        }
    }

    discard;
}

vec3 hash(vec3 a)
{
    a = fract(a * 0.8);
    a += dot(a, a.yxz + 19.19);
    return fract((a.xxy + a.yxx) * a.zyx);
}

void main()
{
    vec4 specRoughness = texture(s_sceneSpecRough, ex_texcoord);
    float roughness = specRoughness.a;

    float g = 1.0 - roughness;
    if (g <= minGlossiness) {
        discard;
    }
 
    vec3 normal = getSceneNormal(ex_texcoord);
    // normal = normalize((u_view.matInvView * vec4(normal, 0.0)).xyz);
    // o_color = vec4(normal * 0.5 + vec3(0.5, 0.5, 0.5), 1.0);
    // return;
    float depth = texture(s_sceneDepth, ex_texcoord).r;
    vec4 projectedPos = vec4(ex_texcoord * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 hPos = u_view.matInvProj * projectedPos;

    // position in view
    vec3 position = hPos.xyz / hPos.w;

    // float sampledDepth = perspectiveDepthToViewZ(texture(s_sceneDepth, ex_texcoord).r, u_view.zRange.x, u_view.zRange.y);

    //o_color = vec4(position.z - sampledDepth, 0.0, 0.0, 1.0);
    //return;
    vec3 reflected = normalize(reflect(normalize(position), normalize(normal)));

    vec3 rayEnd = position + reflected;

    vec4 rayEndProj = u_view.matProj * vec4(rayEnd, 1.0);

    vec3 rayStartScr = vec3(ex_texcoord, depth);
    vec3 rayEndScr = rayEndProj.xyz / rayEndProj.w;
    rayEndScr = rayEndScr * vec3(0.5, 0.5, 0.5) + vec3(0.5, 0.5, 0.5);

    // o_color = vec4(reflected * 2.0 - 1.0, 1.0);
    // return;

    vec3 jitt = mix(vec3(0.0), hash(position), roughness) * roughnessFactor;
    
    ReflectionInfo info = raytraceScr(rayStartScr, rayEndScr, 0.0);
    // ReflectionInfo info = getReflectionInfo(reflected, position); // For debug: no roughness
    // o_color = vec4(info.color, 1.0);
    // return;

    vec2 dCoords = smoothstep(0.2, 0.6, abs(vec2(0.5, 0.5) - info.coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);

    // Fresnel
    // this will be applied in postprocess_composite.fs
    // vec3 F0 = specRoughness.rgb;
    // vec3 fresnel = fresnelSchlick(max(dot(normalize(normal), normalize(position)), 0.0), F0);

    // Apply
    float reflectionMultiplier = clamp(-reflected.z * screenEdgefactor * strength, 0.0, 0.9); 
    // float reflectionMultiplier = clamp(pow(spec * strength, reflectionSpecularFalloffExponent) * screenEdgefactor * reflected.z, 0.0, 0.9);
    // float albedoMultiplier = 1.0 - reflectionMultiplier;
    
    // the fresnel will be applied in postprocess_composite.fs
    vec3 SSR = info.color;// * fresnel;

    o_color = vec4(SSR, reflectionMultiplier);
}
`;

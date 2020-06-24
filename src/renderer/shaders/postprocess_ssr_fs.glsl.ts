/**
 * screen space reflection
 * http://www.kode80.com/blog/2015/03/11/screen-space-reflections-in-unity-5/
 * http://casual-effects.blogspot.jp/2014/08/screen-space-ray-tracing.html
 * mostly form
 * https://github.com/pissang/claygl-advanced-renderer/blob/master/src/SSR.glsl
 * and modified a bit to fit my render pipeline
 */
export default /** glsl */`

#define MAX_ITERATION 20;
#define MAX_BINARY_SEARCH_ITERATION 5;

#include <uniforms_view>
#include <samplers_postprocess>     // s_sceneColor contains prev frame image

// todo: uniforms
// in es 300, we can init the default value in code and it's very convenient
// gl will assign these values at link time
uniform float maxRayDistance = 4;

uniform float pixelStride = 16;
uniform float pixelStrideZCutoff = 10; // ray origin Z at this distance will have a pixel stride of 1.0

uniform float screenEdgeFadeStart = 0.9; // distance to screen edge that ray hits will start to fade (0.0 -> 1.0)

uniform float eyeFadeStart  = 0.4; // ray direction's Z that ray hits will start to fade (0.0 -> 1.0)
uniform float eyeFadeEnd = 0.8; // ray direction's Z that ray hits will be cut (0.0 -> 1.0)

uniform float minGlossiness = 0.2; // Object larger than minGlossiness will have ssr effect
uniform float zThicknessThreshold = 0.1;
uniform float jitterOffset = 0;

// uniform float nearZ;
// uniform vec2 viewportSize: VIEWPORT_SIZE;

// uniform float maxMipmapLevel = 5;

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

#include <function_depth>

// ----------------------------------------------------------------------------
// functions

bool rayIntersectDepth(float rayZNear, float rayZFar, vec2 hitPixel)
{
    // Swap if bigger
    if (rayZFar > rayZNear)
    {
        float t = rayZFar; rayZFar = rayZNear; rayZNear = t;
    }
    float cameraZ = perspectiveDepthToViewZ(texture(s_sceneDepth, hitPixel).r);
    // float cameraBackZ = linearDepth(fetchDepth(backDepthTex, hitPixel));
    // Cross z
    return rayZFar <= cameraZ && rayZNear >= cameraZ - zThicknessThreshold;
}

// Trace a ray in screenspace from rayOrigin (in camera space) pointing in rayDir (in camera space)
//
// With perspective correct interpolation
//
// Returns true if the ray hits a pixel in the depth buffer
// and outputs the hitPixel (in UV space), the hitPoint (in camera space) and the number
// of iterations it took to get there.
//
// Based on Morgan McGuire & Mike Mara's GLSL implementation:
// http://casual-effects.blogspot.com/2014/08/screen-space-ray-tracing.html
bool traceScreenSpaceRay(
    vec3 rayOrigin, vec3 rayDir, float jitter,
    out vec2 hitPixel, out vec3 hitPoint, out float iterationCount
)
{
    float nearZ = u_view.zRange.x;
    mat4 projection = u_view.matProj;
    vec2 viewportSize = u_view.viewport.zw;
    // Clip to the near plane
    float rayLength = ((rayOrigin.z + rayDir.z * maxRayDistance) > -nearZ)
        ? (-nearZ - rayOrigin.z) / rayDir.z : maxRayDistance;

    vec3 rayEnd = rayOrigin + rayDir * rayLength;

    // Project into homogeneous clip space
    vec4 H0 = projection * vec4(rayOrigin, 1.0);
    vec4 H1 = projection * vec4(rayEnd, 1.0);

    float k0 = 1.0 / H0.w, k1 = 1.0 / H1.w;

    // The interpolated homogeneous version of the camera space points
    vec3 Q0 = rayOrigin * k0, Q1 = rayEnd * k1;

    // Screen space endpoints
    // PENDING viewportSize ?
    vec2 P0 = (H0.xy * k0 * 0.5 + 0.5) * viewportSize;
    vec2 P1 = (H1.xy * k1 * 0.5 + 0.5) * viewportSize;

    // If the line is degenerate, make it cover at least one pixel to avoid handling
    // zero-pixel extent as a special case later
    P1 += dot(P1 - P0, P1 - P0) < 0.0001 ? 0.01 : 0.0;
    vec2 delta = P1 - P0;

    // Permute so that the primary iteration is in x to collapse
    // all quadrant-specific DDA case later
    bool permute = false;
    if (abs(delta.x) < abs(delta.y)) {
        // More vertical line
        permute = true;
        delta = delta.yx;
        P0 = P0.yx;
        P1 = P1.yx;
    }
    float stepDir = sign(delta.x);
    float invdx = stepDir / delta.x;

    // Track the derivatives of Q and K
    vec3 dQ = (Q1 - Q0) * invdx;
    float dk = (k1 - k0) * invdx;

    vec2 dP = vec2(stepDir, delta.y * invdx);

    // Calculate pixel stride based on distance of ray origin from camera.
    // Since perspective means distant objects will be smaller in screen space
    // we can use this to have higher quality reflections for far away objects
    // while still using a large pixel stride for near objects (and increase performance)
    // this also helps mitigate artifacts on distant reflections when we use a large
    // pixel stride.
    float strideScaler = 1.0 - min(1.0, -rayOrigin.z / pixelStrideZCutoff);
    float pixStride = 1.0 + strideScaler * pixelStride;

    // Scale derivatives by the desired pixel stride and the offset the starting values by the jitter fraction
    dP *= pixStride; dQ *= pixStride; dk *= pixStride;

    // Track ray step and derivatives in a vec4 to parallelize
    vec4 pqk = vec4(P0, Q0.z, k0);
    vec4 dPQK = vec4(dP, dQ.z, dk);

    pqk += dPQK * jitter;
    float rayZFar = (dPQK.z * 0.5 + pqk.z) / (dPQK.w * 0.5 + pqk.w);
    float rayZNear;

    bool intersect = false;

    vec2 texelSize = 1.0 / viewportSize;

    iterationCount = 0.0;

    for (int i = 0; i < MAX_ITERATION; i++)
    {
        pqk += dPQK;

        rayZNear = rayZFar;
        rayZFar = (dPQK.z * 0.5 + pqk.z) / (dPQK.w * 0.5 + pqk.w);

        hitPixel = permute ? pqk.yx : pqk.xy;
        hitPixel *= texelSize;

        intersect = rayIntersectDepth(rayZNear, rayZFar, hitPixel);

        iterationCount += 1.0;

        // PENDING Right on all platforms?
        if (intersect) {
            break;
        }
    }

    // Binary search refinement
    // FIXME If intersect in first iteration binary search may easily lead to the pixel of reflect object it self
    if (pixStride > 1.0 && intersect && iterationCount > 1.0)
    {
        // Roll back
        pqk -= dPQK;
        dPQK /= pixStride;

        float originalStride = pixStride * 0.5;
        float stride = originalStride;

        rayZNear = pqk.z / pqk.w;
        rayZFar = rayZNear;

        for (int j = 0; j < MAX_BINARY_SEARCH_ITERATION; j++)
        {
            pqk += dPQK * stride;
            rayZNear = rayZFar;
            rayZFar = (dPQK.z * -0.5 + pqk.z) / (dPQK.w * -0.5 + pqk.w);
            hitPixel = permute ? pqk.yx : pqk.xy;
            hitPixel *= texelSize;

            originalStride *= 0.5;
            stride = rayIntersectDepth(rayZNear, rayZFar, hitPixel) ? -originalStride : originalStride;
        }
    }

    Q0.xy += dQ.xy * iterationCount;
    Q0.z = pqk.z;
    hitPoint = Q0 / pqk.w;

    return intersect;
}

float calculateAlpha(
    float iterationCount, float reflectivity,
    vec2 hitPixel, vec3 hitPoint, float dist, vec3 rayDir
)
{
    float alpha = clamp(reflectivity, 0.0, 1.0);
    // Fade ray hits that approach the maximum iterations
    alpha *= 1.0 - (iterationCount / float(MAX_ITERATION));
    // Fade ray hits that approach the screen edge
    vec2 hitPixelNDC = hitPixel * 2.0 - 1.0;
    float maxDimension = min(1.0, max(abs(hitPixelNDC.x), abs(hitPixelNDC.y)));
    alpha *= 1.0 - max(0.0, maxDimension - screenEdgeFadeStart) / (1.0 - screenEdgeFadeStart);

    // Fade ray hits base on how much they face the camera
    float _eyeFadeStart = eyeFadeStart;
    float _eyeFadeEnd = eyeFadeEnd;
    if (_eyeFadeStart > _eyeFadeEnd) {
        float tmp = _eyeFadeEnd;
        _eyeFadeEnd = _eyeFadeStart;
        _eyeFadeStart = tmp;
    }

    float eyeDir = clamp(rayDir.z, _eyeFadeStart, _eyeFadeEnd);
    alpha *= 1.0 - (eyeDir - _eyeFadeStart) / (_eyeFadeEnd - _eyeFadeStart);

    // Fade ray hits based on distance from ray origin
    alpha *= 1.0 - clamp(dist / maxRayDistance, 0.0, 1.0);

    return alpha;
}


void main(void) {
    // vec4 normalAndGloss = texture2D(, ex_texcoord);
    vec3 normal = getSceneNormal(ex_texcoord);
    float rough = texture(s_sceneSpecRough, ex_texcoord).a;

    // Is empty
    // if (dot(normal, vec3(1.0)) == 0.0) {
    //     discard;
    // }

    float g = 1.0 - rough;
    if (g <= minGlossiness) {
        discard;
    }

    float reflectivity = (g - minGlossiness) / (1.0 - minGlossiness);

    vec3 N = normal;

    // Position in view
    vec4 projectedPos = vec4(ex_texcoord * 2.0 - 1.0, texture(s_sceneDepth, ex_texcoord).r * 2.0 - 1.0, 1.0);
    vec4 pos = u_view.matInvProj * projectedPos;
    vec3 rayOrigin = pos.xyz / pos.w;

    vec3 rayDir = normalize(reflect(normalize(rayOrigin), N));
    vec2 hitPixel;
    vec3 hitPoint;
    float iterationCount;

    vec2 uv2 = ex_texcoord * u_view.viewport.zw;
    float jitter = fract((uv2.x + uv2.y) * 0.25 + jitterOffset);

    bool intersect = traceScreenSpaceRay(rayOrigin, rayDir, jitter, hitPixel, hitPoint, iterationCount);

    float dist = distance(rayOrigin, hitPoint);

    float alpha = calculateAlpha(iterationCount, reflectivity, hitPixel, hitPoint, dist, rayDir) * float(intersect);

    vec3 hitNormal = getSceneNormal(hitPixel);

    // Ignore the pixel not face the ray
    // TODO fadeout ?
    // PENDING Can be configured?
    if (dot(hitNormal, rayDir) >= 0.0) {
        discard;
    }

    // vec4 color = decodeHDR(texture2DLodEXT(sourceTexture, hitPixel, clamp(dist / maxRayDistance, 0.0, 1.0) * maxMipmapLevel));

    if (!intersect) {
        // todo: sample cubemaps in cluster
        discard;
    }
    vec4 color = texture(s_sceneColor, hitPixel);
    o_color = vec4(color, alpha);
}

`;
/**
 * full view overlay for debugging show clusters
 */
export default /** glsl */`
#include <uniforms_view>
#include <samplers_postprocess>
#include <function_cluster>
#include <function_get_items>

// todo: control what debug info to draw?
//      cluster z slice with different colors;
//      cluster row colume with different colors;
//      cluster item count (light, reflprobe, irrprobe and decals later)
#define DRAW_CLUSTER        0
#define DRAW_SLICE          1
#define DRAW_COLROW         2
#define DRAW_LIGHT_COUNT    3
#define DRAW_REFL_COUNT     4
#define DRAW_IRR_COUNT      5
#define DRAW_DECAL_COUNT    6

#define MAX_COUNT_REF       4.0

uniform int u_debugDrawMode;

float getLinearDepth(vec2 scrUV) {
    // now only have perspective camera
    float fragDepth = texture(s_sceneDepth, scrUV).r;
    float viewZ = perspectiveDepthToViewZ(fragDepth, u_view.zRange.x, u_view.zRange.y);
    return viewZToOrthoDepth(viewZ, u_view.zRange.x, u_view.zRange.y);
}

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

void main(void) {

    vec4 projectedPos = vec4(ex_texcoord * 2.0 - 1.0, texture(s_sceneDepth, ex_texcoord).r * 2.0 - 1.0, 1.0);

    // Position in view
    vec4 viewPos = u_view.matInvProj * projectedPos;
    // todo: handle orthographic
    // perspective devide
    viewPos /= viewPos.w;
    // vec3 worldPos = (u_view.matInvView * viewPos).xyz;

    // get the cluster index of this pixel
    // todo: use hPosition, not projected position
    // according to opengl projection matrix
    float w = -viewPos.z;
    vec4 hPosition = projectedPos * w;
    uint cluster = clusterOfPixel(hPosition);

    vec4 colors[6] = vec4[6](vec3(1.0, 0.0, 0.0, 0.5),
        vec3(0.0, 1.0, 0.0, 0.5),
        vec3(0.0, 0.0, 1.0, 0.5),
        vec3(0.0, 1.0, 1.0, 0.5),
        vec3(1.0, 0.0, 1.0, 0.5),
        vec3(1.0, 1.0, 0.0, 0.5)
    );

    uint idx = 0u;
    uint colorCount = 6u;
    if (u_debugDrawMode == DRAW_CLUSTER) {
        idx = mod(cluster, colorCount);
        o_color = colors[idx];
    } else if (u_debugDrawMode == DRAW_SLICE) {
        // todo: define colors?
        uint slice = sliceFromViewZ(w);
        idx = mod(slice, colorCount);
        o_color = colors[idx];
    } else if (u_debugDrawMode == DRAW_COLROW) {
        uvec2 colRow = colRowFromNDCxy(projectedPos.xy);
        uvec2 numColRows = uvec2(u_view.clusterParams.xy);
        idx = mod(colRow.y * numColRows.x + colRow.x, colorCount);
        o_color = colors[idx];
    } else if (u_debugDrawMode == DRAW_LIGHT_COUNT) {
        // todo: use a ramp color to describe the count
        // lerp from blue to yellow?
        float lightCount = float(getLightCountInCluster(cluster));
        o_color = mix(vec4(0.0, 0.0, 1.0, 0.5), vec4(1.0, 1.0, 0.0, 0.5), clamp(lightCount / MAX_COUNT_REF, 0.0, 1.0));
    } else if (u_debugDrawMode == DRAW_REFL_COUNT) {
        uint start = 0u;
        uint count = 0u;
        getEnvProbeIndicesInCluster(cluster, start, count);
        o_color = mix(vec4(0.0, 0.0, 1.0, 0.5), vec4(1.0, 1.0, 0.0, 0.5), clamp(float(count) / MAX_COUNT_REF, 0.0, 1.0));
    } else if (u_debugDrawMode == DRAW_IRR_COUNT) {
        uint start = 0u;
        uint count = 0u;
        getIrrProbeIndicesInCluster(cluster, start, count);
        o_color = mix(vec4(0.0, 0.0, 1.0, 0.5), vec4(1.0, 1.0, 0.0, 0.5), clamp(float(count) / MAX_COUNT_REF, 0.0, 1.0));
    } else if (u_debugDrawMode == DRAW_DECAL_COUNT) {
        // no decal yet
        o_color = vec4(0., 0., 0., 0.);
    } else {
        o_color = vec4(0., 0., 0., 0.);
    }
}
`;
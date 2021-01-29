/**
 * edge detect shader
 */
export default /** glsl */`
#include <uniforms_view>
#include <samplers_postprocess>
#include <function_depth>

#define MAX_CATEGORY_COLORS      32

// uniform sampler2D s_source;                      // should use tag render target?
// uniform float u_blurRadius;
uniform vec2                    u_unitOffset;       // horiz (blurRadius * texelSize, 0.0) or vertical (0.0, blurRadius * texelSize)

uniform vec4                    u_silhouetteColors[MAX_CATEGORY_COLORS]; // allow different object tag has different colors
uniform int                     u_selectMode;       // 0 - outline around every object, 1 - outline object with tag == u_tagRef, 2 - outline object with tag == texture(s_source, u_cursorPosition).r
uniform float                   u_tagRef;
                                                    // when hover, output object feature to tag RT?
uniform vec2                    u_positionRef;      // xy ranges [0, 1], normalized cursor position
uniform float                   u_maxDistance;      // max distance to display silhouette

in vec2                         ex_texcoord;
layout(location = 0) out vec4   o_color;

int categoryFromTag(float tag) {
    if(tag < 0.0) return -1;
    return int(tag) / 100;
}

float outlineAmount(vec2 uv, float tagRef) {
    float pixelTag = getSceneTag(uv);
    if(pixelTag < -0.5) return 0.0;
    return abs(pixelTag - tagRef) < 0.001 ? 1.0 : 0.0;
    // int pixelCategory = categoryFromTag(pixelTag);
    // return pixelCategory == tagRef ? 1.0 : 0.0;
}

void main(void) {

    float pixelTag = getSceneTag(ex_texcoord);
    int pixelCategory = categoryFromTag(pixelTag);

    //if(pixelTag < 0.0)
    //    discard;

    // debug show tag and color
    // int debugIdx = clamp(int(pixelTag), 0, MAX_CATEGORY_COLORS - 1);
    // o_color = u_silhouetteColors[debugIdx];
    // return;

    // todo: use 1 number to contain both tag and object ID?
    // tag * 10000 + id?

    float tagRef = u_tagRef;
    float dist = 0.0;

    if (u_selectMode == 2) {
        // tagRef = categoryFromTag(getSceneTag(u_positionRef));
        tagRef = getSceneTag(u_positionRef);
        float depth = texture(s_sceneDepth, u_positionRef).r;
        dist = abs(perspectiveDepthToViewZ(depth, u_view.zRange.x, u_view.zRange.y));
    }

    if (dist > u_maxDistance) {
        discard;
    }

    if (tagRef < 0.0) {
        discard;
    }

    // we only need outline, so skip interior pixels
    // if(abs(pixelTag - tagRef) < 0.001) {
    if(pixelTag == tagRef) {
        discard;
        // o_color = vec4(1.0, 0.0, 0.0, 0.5);
        // o_color = u_silhouetteColors[clamp(pixelCategory, 0, MAX_CATEGORY_COLORS - 1)]
        // return;
    }

    // o_color = vec4(1.0, 0.0, 0.0, 0.5);
    // return;

    // sample 5x5 area around cur pixel, if any == tagRef, should be outline
    float sumOutline = 0.0;
    // float minDist = 10000.0;

    for (float i = -2.0; i < 2.5; i++) {
        for (float j = -2.0; j < 2.5; j++) {
            vec2 sampUV = ex_texcoord + vec2(i, j) * u_unitOffset;
            sumOutline += outlineAmount(sampUV, tagRef);
            // float fragDepth = texture(s_sceneDepth, sampUV).r;
            // minDist = min(abs(perspectiveDepthToViewZ(fragDepth, u_view.zRange.x, u_view.zRange.y)), minDist);
        }
    }

    // if (minDist > u_maxDistance)
    //    discard;

    // o_color = vec4(1.0, 0.0, 0.0, sumOutline);
    // return;

    // or discard
    if(sumOutline < 0.01)
        discard;

    sumOutline *= 0.08;     // 2.0 / 25.0

    // get color
    int categoryRef = categoryFromTag(tagRef);
    int categoryIdx = clamp(categoryRef, 0, MAX_CATEGORY_COLORS - 1);
    o_color = u_silhouetteColors[categoryIdx];
    o_color.a *= sumOutline;
}
`;
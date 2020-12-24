/**
 * edge detect shader
 */
export default /** glsl */`
#include <samplers_postprocess>

#define MAX_NUM_TAG_COLORS      32

// uniform sampler2D s_source;                      // should use tag render target?
// uniform float u_blurRadius;
uniform vec2                    u_unitOffset;       // horiz (blurRadius * texelSize, 0.0) or vertical (0.0, blurRadius * texelSize)

uniform vec4                    u_silhouetteColors[MAX_NUM_TAG_COLORS]; // allow different object tag has different colors
uniform int                     u_selectMode;       // 0 - outline around every object, 1 - outline object with tag == u_tagRef, 2 - outline object with tag == texture(s_source, u_cursorPosition).r
uniform float                   u_tagRef;           // object tag may be object id, or object feature (locked, opened, dangerous...)?
                                                    // when hover, output object feature to tag RT?
uniform vec2                    u_positionRef;      // xy ranges [0, 1], normalized cursor position

in vec2                         ex_texcoord;
layout(location = 0) out vec4   o_color;

float outlineAmount(vec2 uv, float tagRef) {
    float pixelTag = getSceneTag(uv);
    return abs(pixelTag - tagRef) < 0.001 ? 1.0 : 0.0;
}

void main(void) {

    float pixelTag = getSceneTag(ex_texcoord);
    // empty
    if(pixelTag == -1.0) {
        discard;
    }

    float tagRef = u_tagRef;
    if (u_selectMode == 2) {
        tagRef = getSceneTag(u_positionRef);
    }

    // we only need outline, so skip interior pixels
    if(abs(pixelTag - tagRef) < 0.001)
        discard;

    // sample 5x5 area around cur pixel, if any == tagRef, should be outline
    float sumOutline = 0.0;

    for (float i = -2; i < 2.5; i++) {
        for (float j = -2; j < 2.5; j++) {
            sumOutline += outlineAmount(ex_texcoord + vec2(i, j) * u_unitOffset, tagRef);
        }
    }

    // or discard
    if(sumOutline < 0.001)
        discard;

    sumOutline *= 0.04;     // 1.0 / 25.0

    // get color
    int tagIdx = int(round(pixelTag));
    tagIdx = clamp(tagIdx, 0, MAX_NUM_TAG_COLORS - 1);
    o_color = u_silhouetteColors[tagIdx] * sumOutline;
}
`;
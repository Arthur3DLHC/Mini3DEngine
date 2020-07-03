/**
 * cubemap fix edge filter
 * http://www.pixelmaven.com/jason/articles/ATI/Isidoro_CubeMapFiltering_2005_Slides.pdf
 */
export default /** glsl */`
precision lowp sampler2DArray;
#include <function_cubemap>

uniform sampler2DArray  s_source;
uniform int             u_layer;
uniform float           u_texSize;

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

void main(void)
{
    // get face index from UV
    vec2 uv = ex_texcoord * vec2(6.0, 1.0);
    float u = floor(uv.x);
    int faceIdx = int(u);
    uv.x -= u;

    // todo: if uv is on edge, average the pixel color
    float edgeWidth = 1.0 / u_texSize;

    // not border texel, copy and early quit.
    if (uv.x >= edgeWidth && uv.x <= 1.0 - edgeWidth && uv.y >= edgeWidth && uv.y <= 1.0 - edgeWidth) {
        o_color = texture(s_source, vec3(ex_texcoord, float(u_layer)));
        return;
    }

    int adjFaceIdx = 0;
    vec2 adjuv = uv;    // uv in cube face
    // find adjacent cube face, and calc opposite texel uv
    if (faceIdx == CUBE_FACE_POSITIVE_X) {
        if (uv.x < edgeWidth) {// left
            adjFaceIdx = CUBE_FACE_POSITIVE_Z;
            adjuv.x = 1.0 - uv.x;
        } else if(uv.x > 1.0 - edgeWidth) {// right
            adjFaceIdx = CUBE_FACE_NEGATIVE_Z;
            adjuv.x = 1.0 - uv.x;
        }

        if(uv.y < edgeWidth) {// bottom
            adjFaceIdx = CUBE_FACE_NEGATIVE_Y;
            // need swap xy
            adjuv.y = uv.x;
            adjuv.x = uv.y;
        } else if(uv.y > 1.0 - edgeWidth) {// top
            adjFaceIdx = CUBE_FACE_POSITIVE_Y;
            // need swap xy
            adjuv.y = 1.0 - uv.x;
            adjuv.x = 1.0 - uv.y;
        }

    } else if (faceIdx == CUBE_FACE_NEGATIVE_X) {
        if (uv.x < edgeWidth) {// left
            adjFaceIdx = CUBE_FACE_NEGATIVE_Z;
            adjuv.x = 1.0 - uv.x;
        } else if(uv.x > 1.0 - edgeWidth) {// right
            adjFaceIdx = CUBE_FACE_POSITIVE_Z;
            adjuv.x = 1.0 - uv.x;
        }

        if(uv.y < edgeWidth) {// bottom
            adjFaceIdx = CUBE_FACE_NEGATIVE_Y;
            // need swap xy
            adjuv.y = 1.0 - uv.x;
            adjuv.x = 1.0 - uv.y;
        } else if(uv.y > 1.0 - edgeWidth) {// top
            adjFaceIdx = CUBE_FACE_POSITIVE_Y;
            // need swap xy
            adjuv.y = uv.x;
            adjuv.x = uv.y;
        }
    } else if (faceIdx == CUBE_FACE_POSITIVE_Y) {
        if (uv.x < edgeWidth) {// left
            adjFaceIdx = CUBE_FACE_POSITIVE_X;
            // need swap xy
            adjuv.y = 1.0 - uv.x;
            adjuv.x = 1.0 - uv.y;
        } else if(uv.x > 1.0 - edgeWidth) {// right
            adjFaceIdx = CUBE_FACE_NEGATIVE_X;
            adjuv.y = uv.x;
            adjuv.x = uv.y;
        }

        if(uv.y < edgeWidth) {// bottom
            adjFaceIdx = CUBE_FACE_NEGATIVE_Z;
            adjuv.x = uv.x;
            adjuv.y = 1.0 - uv.y;
        } else if(uv.y > 1.0 - edgeWidth) {// top
            adjFaceIdx = CUBE_FACE_POSITIVE_Z;
            adjuv.x = 1.0 - uv.x;
            adjuv.y = uv.y;
        }
    } else if (faceIdx == CUBE_FACE_NEGATIVE_Y) {
        if (uv.x < edgeWidth) {// left
            adjFaceIdx = CUBE_FACE_POSITIVE_X;  // same as posY
            adjuv.y = uv.x;
            adjuv.x = uv.y;
        } else if(uv.x > 1.0 - edgeWidth) {// right
            adjFaceIdx = CUBE_FACE_NEGATIVE_X;  // same as posY
            adjuv.y = 1.0 - uv.x;
            adjuv.x = 1.0 - uv.y;
        }

        if(uv.y < edgeWidth) {// bottom
            adjFaceIdx = CUBE_FACE_POSITIVE_Z;
            adjuv.x = 1.0 - uv.x;
            adjuv.y = uv.y;
        } else if(uv.y > 1.0 - edgeWidth) {// top
            adjFaceIdx = CUBE_FACE_NEGATIVE_Z;
            adjuv.x = uv.x;
            adjuv.y = 1.0 - uv.y;
        }
    } else if (faceIdx == CUBE_FACE_POSITIVE_Z) {
        if (uv.x < edgeWidth) {// left
            adjFaceIdx = CUBE_FACE_NEGATIVE_X;
            adjuv.x = 1.0 - uv.x;
        } else if(uv.x > 1.0 - edgeWidth) {// right
            adjFaceIdx = CUBE_FACE_POSITIVE_X;
            adjuv.x = 1.0 - uv.x;
        }

        if(uv.y < edgeWidth) {// bottom
            adjFaceIdx = CUBE_FACE_NEGATIVE_Y;
            // do not need swap xy
            adjuv.x = 1.0 - uv.x;
            adjuv.y = uv.y;
        } else if(uv.y > 1.0 - edgeWidth) {// top
            adjFaceIdx = CUBE_FACE_POSITIVE_Y;
            // do not need swap xy
            adjuv.x = 1.0 - uv.x;
            adjuv.y = uv.y;
        }
    } else if (faceIdx == CUBE_FACE_NEGATIVE_Z) {
        if (uv.x < edgeWidth) {// left
            adjFaceIdx = CUBE_FACE_POSITIVE_X;
            adjuv.x = 1.0 - uv.x;
        } else if(uv.x > 1.0 - edgeWidth) {// right
            adjFaceIdx = CUBE_FACE_NEGATIVE_X;
            adjuv.x = 1.0 - uv.x;
        }

        if(uv.y < edgeWidth) {// bottom
            adjFaceIdx = CUBE_FACE_NEGATIVE_Y;
            adjuv.x = uv.x;
            adjuv.y = 1.0 - uv.y;
        } else if(uv.y > 1.0 - edgeWidth) {// top
            adjFaceIdx = CUBE_FACE_POSITIVE_Y;
            adjuv.x = uv.x;
            adjuv.y = 1.0 - uv.y;
        }
    }

    vec4 sourceColor = texture(s_source, vec3(ex_texcoord, float(u_layer)));
    vec4 adjColor = texture(s_source, vec3(float(adjFaceIdx) / 6.0 + adjuv.x, adjuv.y, float(u_layer)));

    o_color = (sourceColor + adjColor) * 0.5;
}
`;
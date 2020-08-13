/**
 * cubemap fix edge filter
 * http://www.pixelmaven.com/jason/articles/ATI/Isidoro_CubeMapFiltering_2005_Slides.pdf
 */
export default /** glsl */`
precision highp sampler2DArray;

#include <function_cubemap>

uniform sampler2DArray  s_source;       // one cubemap, 6 faces
uniform int             u_faceIdx;        // cube face idx
uniform float           u_level;        // diffuse only have one level
uniform float           u_texSize;

in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

void main(void)
{
    //o_color = textureLod(s_source, ex_texcoord, u_level);
    //o_color = texture(s_source, ex_texcoord);
    //o_color = vec4(1.0, 0.0, 0.0, 1.0);
    //return;

    // get face index from UV
    // vec2 uv = ex_texcoord * vec2(6.0, 1.0);
    // float u = floor(uv.x);
    // int faceIdx = int(u);
    // uv.x -= u;
    vec2 uv = ex_texcoord;
    int faceIdx = u_faceIdx;

    // todo: if uv is on edge, average the pixel color
    float edgeWidth = 1.0 / u_texSize;

    // not border texel, copy and early quit.
    if (uv.x >= edgeWidth && uv.x <= 1.0 - edgeWidth && uv.y >= edgeWidth && uv.y <= 1.0 - edgeWidth) {
        o_color = textureLod(s_source, vec3(uv, float(faceIdx)), u_level);
        //o_color = vec4(1.0, 0.0, 0.0, 1.0);
        return;
    }

    vec4 sumColor = textureLod(s_source, vec3(uv, float(faceIdx)), u_level);
    float weight = 1.0;

    int adjFaceIdx = 0;
    vec2 adjuv = uv;    // uv in cube face
    // note: OpenGL use right-handed coordinate space
    // find adjacent cube face, and calc opposite texel uv
    if (faceIdx == CUBE_FACE_POSITIVE_X) {
        if (uv.x < edgeWidth) {// left
            adjFaceIdx = CUBE_FACE_NEGATIVE_Z;
            adjuv.x = clamp(1.0 - uv.x, 0.0, 1.0);
            adjuv.y = uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        } else if(uv.x > 1.0 - edgeWidth) {// right
            adjFaceIdx = CUBE_FACE_POSITIVE_Z;
            adjuv.x = clamp(1.0 - uv.x, 0.0, 1.0);
            adjuv.y = uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        }

        if(uv.y < edgeWidth) {// bottom
            adjFaceIdx = CUBE_FACE_NEGATIVE_Y;
            // need swap xy
            adjuv.y = uv.x;
            adjuv.x = uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        } else if(uv.y > 1.0 - edgeWidth) {// top
            adjFaceIdx = CUBE_FACE_POSITIVE_Y;
            // need swap xy
            adjuv.y = uv.x;
            adjuv.x = uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        }

    } else if (faceIdx == CUBE_FACE_NEGATIVE_X) {
        if (uv.x < edgeWidth) {// left
            adjFaceIdx = CUBE_FACE_POSITIVE_Z;
            adjuv.x = clamp(1.0 - uv.x, 0.0, 1.0);
            adjuv.y = uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        } else if(uv.x > 1.0 - edgeWidth) {// right
            adjFaceIdx = CUBE_FACE_NEGATIVE_Z;
            adjuv.x = clamp(1.0 - uv.x, 0.0, 1.0);
            adjuv.y = uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        }

        if(uv.y < edgeWidth) {// bottom
            adjFaceIdx = CUBE_FACE_NEGATIVE_Y;
            // need swap xy
            adjuv.y = 1.0 - uv.x;
            adjuv.x = 1.0 - uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        } else if(uv.y > 1.0 - edgeWidth) {// top
            adjFaceIdx = CUBE_FACE_POSITIVE_Y;
            // need swap xy
            adjuv.y = 1.0 - uv.x;
            adjuv.x = 1.0 - uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        }
    } else if (faceIdx == CUBE_FACE_POSITIVE_Y) {
        if (uv.x < edgeWidth) {// left
            adjFaceIdx = CUBE_FACE_NEGATIVE_X;
            // need swap xy
            adjuv.y = 1.0 - uv.x;
            adjuv.x = 1.0 - uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        } else if(uv.x > 1.0 - edgeWidth) {// right
            adjFaceIdx = CUBE_FACE_POSITIVE_X;
            adjuv.y = uv.x;
            adjuv.x = uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        }

        if(uv.y < edgeWidth) {// bottom
            adjFaceIdx = CUBE_FACE_NEGATIVE_Z;
            adjuv.x = uv.x;
            adjuv.y = 1.0 - uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        } else if(uv.y > 1.0 - edgeWidth) {// top
            adjFaceIdx = CUBE_FACE_POSITIVE_Z;
            adjuv.x = clamp(1.0 - uv.x, 0.0, 1.0);
            adjuv.y = uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        }
    } else if (faceIdx == CUBE_FACE_NEGATIVE_Y) {
        if (uv.x < edgeWidth) {// left
            adjFaceIdx = CUBE_FACE_NEGATIVE_X;  // same as posY
            adjuv.y = 1.0 - uv.x;
            adjuv.x = 1.0 - uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        } else if(uv.x > 1.0 - edgeWidth) {// right
            adjFaceIdx = CUBE_FACE_POSITIVE_X;  // same as posY
            adjuv.y = uv.x;
            adjuv.x = uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        }

        if(uv.y < edgeWidth) {// bottom
            adjFaceIdx = CUBE_FACE_POSITIVE_Z;
            adjuv.x = uv.x;
            adjuv.y = 1.0 - uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        } else if(uv.y > 1.0 - edgeWidth) {// top
            adjFaceIdx = CUBE_FACE_NEGATIVE_Z;
            adjuv.x = clamp(1.0 - uv.x, 0.0, 1.0);
            adjuv.y = uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        }
    } else if (faceIdx == CUBE_FACE_POSITIVE_Z) {
        if (uv.x < edgeWidth) {// left
            adjFaceIdx = CUBE_FACE_POSITIVE_X;
            adjuv.x = clamp(1.0 - uv.x, 0.0, 1.0);
            adjuv.y = uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        } else if(uv.x > 1.0 - edgeWidth) {// right
            adjFaceIdx = CUBE_FACE_NEGATIVE_X;
            adjuv.x = clamp(1.0 - uv.x, 0.0, 1.0);
            adjuv.y = uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        }

        if(uv.y < edgeWidth) {// bottom
            adjFaceIdx = CUBE_FACE_NEGATIVE_Y;
            // do not need swap xy
            adjuv.x = uv.x;
            adjuv.y = 1.0 - uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        } else if(uv.y > 1.0 - edgeWidth) {// top
            adjFaceIdx = CUBE_FACE_POSITIVE_Y;
            // do not need swap xy
            adjuv.x = clamp(1.0 - uv.x, 0.0, 1.0);
            adjuv.y = uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        }
    } else if (faceIdx == CUBE_FACE_NEGATIVE_Z) {
        if (uv.x < edgeWidth) {// left
            adjFaceIdx = CUBE_FACE_NEGATIVE_X;
            adjuv.x = clamp(1.0 - uv.x, 0.0, 1.0);
            adjuv.y = uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        } else if(uv.x > 1.0 - edgeWidth) {// right
            adjFaceIdx = CUBE_FACE_POSITIVE_X;
            adjuv.x = clamp(1.0 - uv.x, 0.0, 1.0);
            adjuv.y = uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        }

        if(uv.y < edgeWidth) {// bottom
            adjFaceIdx = CUBE_FACE_NEGATIVE_Y;
            adjuv.x = 1.0 - uv.x;
            adjuv.y = uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        } else if(uv.y > 1.0 - edgeWidth) {// top
            adjFaceIdx = CUBE_FACE_POSITIVE_Y;
            adjuv.x = uv.x;
            adjuv.y = 1.0 - uv.y;
            sumColor += textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
            weight += 1.0;
        }
    }

    o_color = (sumColor / weight) * vec4(1.0, 0.0, 0.0, 1.0);

    // vec4 sourceColor = textureLod(s_source, vec3(ex_texcoord, float(faceIdx)), u_level);
    // vec4 adjColor = textureLod(s_source, vec3(adjuv, float(adjFaceIdx)), u_level);
    // o_color = (sourceColor + adjColor) * 0.5;
}
`;
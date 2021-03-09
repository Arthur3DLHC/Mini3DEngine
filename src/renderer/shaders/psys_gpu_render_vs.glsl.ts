/**
 * render particles
 */
export default /** glsl */`
// version is specified by GLProgram class
// uniforms
#include <uniforms_scene>
#include <uniforms_view>
#include <uniforms_object>      // for get psys transform and properties

// psys property uniforms

#define             NOLIMIT         0
#define             LIMIT_AXIS      1
#define             LIMIT_DIR       2


//                  NOLIMIT                 AXIS                    DIRECTION
// -------------------------------------------------------------------------------------
// isBillboard      facing camera           try to facing camera    try to facing camera
//                  rotate angle 2D         but limit to axis       but limit to moving dir
// -------------------------------------------------------------------------------------
// notBillboard     align to local space    rotate cur angle        rotate cur angle
//                  of geometry             along axis              along moving dir
// -------------------------------------------------------------------------------------
uniform int             u_isBillboard;      // still may be plane or mesh; this only indicate facing camera behavior.
                                            // if not a billboard, for now, the particle geometry will always turn towards it's moving direction.
uniform int             u_rotationLimit;    // billboard rotation limit mode. 0 - no limit, always facing camera; 1 - limit to specified axis; 2 - limit to particle direction
uniform vec3            u_limitAxis;        // limit rotation axis
uniform vec3            u_refDir;           // when is not billboard and limit rotation axis, this is the 'up' dir when calc lookat rotation matrix
uniform vec3            u_texAnimSheetInfo; // xy: uv scale z: num frames per row

uniform ivec4           u_useGradientTextures;  // x: use color gradient y: use size gradient

uniform sampler2D       s_colorGradient;
uniform sampler2D       s_sizeGradient;

#include <attrib_locations>

// for instance attributes, add an offset of 8
#define POSITION_LOC    5
#define DIRECTION_LOC   6
#define AGE_LIFE_LOC    7
#define SEED_LOC        8
#define SIZE_LOC        9
#define COLOR_LOC       10
#define FRAME_INDEX_LOC 11
#define ANGLE_LOC       12

// geometry vertex attribute
// particles can be billboard(plane) or shaped geometries
// and can be lightten and shadowed by punctual lights and irradiance probes
// (do lighting per vertex if particles are billborad?)
layout(location = POSITION_LOCATION)    in vec3 a_position;
layout(location = NORMAL_LOCATION)      in vec3 a_normal;
layout(location = TANGENT_LOCATION)     in vec3 a_tangent;
layout(location = TEXCOORD0_LOCATION)   in vec2 a_texcoord0;

// particle instance attributes
layout(location = POSITION_LOC)         in vec3 p_position;     // already in world space in update shader
layout(location = DIRECTION_LOC)        in vec3 p_direction;    // unnormaled. actually, 'velocity'. world space
layout(location = AGE_LIFE_LOC)         in vec2 p_ageLife;
layout(location = SEED_LOC)             in vec4 p_seed;
layout(location = SIZE_LOC)             in vec3 p_size;
layout(location = COLOR_LOC)            in vec4 p_color;
layout(location = FRAME_INDEX_LOC)      in float p_frameIdx;    // use a float value to enable blending between 2 frames
layout(location = ANGLE_LOC)            in vec2 p_angle;        // x: current rotate angle; y: angular speed

#include <function_transforms>

// vertex output
// what does the fragment shader need to draw the particle?
out vec4 ex_hPosition;
out vec3 ex_worldPosition;
out vec3 ex_worldNormal;
out vec3 ex_worldTangent;
out vec3 ex_worldBinormal; 
out vec4 ex_color;           // if particle is dead, set alpha to zero then discard it in fs
out vec2 ex_texcoord0;       // for blending between two frames
out vec2 ex_texcoord1;       //
out float ex_texMixAmount;

vec2 calcAnimFrameTexcoord(float frame) {
    float row = floor(frame / u_texAnimSheetInfo.z);
    float col = frame - row * u_texAnimSheetInfo.z;

    vec2 uvScale = u_texAnimSheetInfo.xy;
    vec2 uv = (a_texcoord0 + vec2(col, row)) * uvScale;

    // the anim sheet is left to right, top to bottom order
    // so inverse the texcoord.y?
    // uv.y = 1.0 - uv.y;
    return uv;
}

void main(void)
{
    vec4 localPosition = vec4(a_position, 1.0);

    // todo: optimize dead particles (a_color.a == 0)

    // todo: calc world transform from particle instance attribs
    // 2D rotation angle matrix
    mat4 matScale = mat4(1.0);

    vec3 scale = p_size.xyz;

    if (u_useGradientTextures.y > 0) {
        vec3 sizeGrad = texture(s_sizeGradient, vec2(p_ageLife.x / p_ageLife.y, 0.5)).xyz;
        scale *= sizeGrad;
    }

    matScale[0][0] = scale.x;
    matScale[1][1] = scale.y;
    matScale[2][2] = scale.z;

    mat4 matRot2D = mat4(1.0);
    // rotation matrix along z axis?
    float s2d = sin(p_angle.x);
    float c2d = cos(p_angle.x);

    matRot2D[0][0] = c2d;
    matRot2D[0][1] = s2d;
    matRot2D[1][0] = -s2d;
    matRot2D[1][1] = c2d;

    mat4 matRot3D = mat4(1.0);
    mat4 matTranslation = mat4(1.0);
    // 4th colume is translation?
    matTranslation[3] = vec4(p_position, 1.0);

    mat4 matNormal = mat4(1.0);

    mat4 matView = u_view.matView;

    vec3 limitDir;
    if (u_rotationLimit == LIMIT_AXIS) {
        limitDir = u_limitAxis;
    } else if (u_rotationLimit == LIMIT_DIR) {
        // todo: divide by zero protect
        limitDir = normalize(p_direction);
    }

    if(u_isBillboard > 0) { // is a billboard
        if (u_rotationLimit == NOLIMIT) {
            matNormal = transpose(matView) * matRot2D;
            // discard rotation part of view matrix
            matView[0] = vec4(1.0, 0.0, 0.0, 0.0);
            matView[1] = vec4(0.0, 1.0, 0.0, 0.0);
            matView[2] = vec4(0.0, 0.0, 1.0, 0.0);
        } else {
            // calc a local rotation matrix trying to look at camera
            // align y axis to limit dir?
            vec3 frontDir = normalize(u_view.position - p_position);
            vec3 sideDir = normalize(cross(limitDir, frontDir));
            frontDir = normalize(cross(sideDir, limitDir));
            matRot3D[0] = vec4(sideDir, 0.);
            matRot3D[1] = vec4(limitDir, 0.);
            matRot3D[2] = vec4(frontDir, 0.);

            matNormal = matRot3D * matRot2D;
        }
    } else {    // not a billboard
        if (u_rotationLimit != NOLIMIT) {
            // align geometry local z axis toward limit dir
            vec3 frontDir = limitDir;
            vec3 upDir = u_refDir;
            vec3 sideDir = normalize(cross(frontDir, upDir));
            upDir = normalize(cross(sideDir, frontDir));
            matRot3D[0] = vec4(sideDir, 0.);
            matRot3D[1] = vec4(upDir, 0.);
            matRot3D[2] = vec4(frontDir, 0.);
        }
        // if no limit, use geometry local transform (keep matRot3D as identity)

        matNormal = matRot3D * matRot2D;
    }

    // also for normal, tangent, binormal
    mat4 matRot = matRot3D * matRot2D;

    // have nothing to do with object world transform.
    mat4 matWorld = matTranslation * matRot * matScale;

    vec4 worldPosition = matWorld * localPosition;
    vec4 viewPosition = matView * worldPosition;
    gl_Position = ex_hPosition = viewToProj(viewPosition);

    ex_worldPosition = worldPosition.xyz;
    // world space normal, tangent, binormal
    // fix me: billboards error
    ex_worldNormal = (matNormal * vec4(a_normal, 0.0)).xyz;
    ex_worldTangent = (matNormal * vec4(a_tangent, 0.0)).xyz;
    ex_worldBinormal = cross(ex_worldNormal, ex_worldTangent);

    ex_color = u_object.color * p_color;

    if (u_useGradientTextures.x > 0) {
        vec4 colorGrad = texture(s_colorGradient, vec2(p_ageLife.x / p_ageLife.y, 0.5));
        ex_color *= colorGrad;
    }

    // texcoord animation
    ex_texMixAmount = fract(p_frameIdx);
    float curFrame = floor(p_frameIdx);
    float nextFrame = curFrame + 1.0;

    // curFrame = 10.0;
    // nextFrame = 10.0;

    ex_texcoord0 = calcAnimFrameTexcoord(curFrame);
    ex_texcoord1 = calcAnimFrameTexcoord(nextFrame);

    // ex_texcoord0 = a_texcoord0 * u_texAnimSheetInfo.xy;
    // ex_texcoord1 = a_texcoord0 * u_texAnimSheetInfo.xy;
}

`;
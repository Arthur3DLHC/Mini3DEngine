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
uniform vec3            u_limitAxis;
uniform float           u_texAnimFrames;    // total texture animation frame count. to calc cur frame texcoord.
                                            // fix me: or should use tex2darray for animation frames?

#include <attrib_locations>

// for instance attributes, add an offset of 8
#define POSITION_LOC    8
#define DIRECTION_LOC   9
#define AGE_LIFE_LOC    10
#define SEED_LOC        11
#define SIZE_LOC        12
#define COLOR_LOC       13
#define FRAME_INDEX_LOC 14
#define ANGLE_LOC       15

// geometry vertex attribute
// particles can be billboard(plane) or shaped geometries
// and can be lightten and shadowed by punctual lights and irradiance probes
// (do lighting per vertex if particles are billborad?)
layout(location = POSITION_LOCATION)    in vec3 a_position;
layout(location = NORMAL_LOCATION)      in vec3 a_normal;
layout(location = TEXCOORD0_LOCATION)   in vec2 a_texcoord0;

// particle instance attributes
layout(location = POSITION_LOC)         in vec3 p_position;
layout(location = DIRECTION_LOC)        in vec3 p_direction;    // unnormaled. actually, 'velocity'
layout(location = AGE_LIFE_LOC)         in vec2 p_ageLife;
layout(location = SEED_LOC)             in vec4 p_seed;
layout(location = SIZE_LOC)             in vec3 p_size;
layout(location = COLOR_LOC)            in vec4 p_color;
layout(location = FRAME_INDEX_LOC)      in float p_frameIdx;    // use a float value to enable blending between 2 frames
layout(location = ANGLE_LOC)            in vec2 p_angle;        // x: current rotate angle; y: angular speed

#include <function_transforms>

// vertex output
// what does the fragment shader need to draw the particle?

out vec4 ex_color;           // if particle is dead, set alpha to zero then discard it in fs
out vec2 ex_texcoord0;       // for blending between two frames
out vec2 ex_texcoord1;       //
out float ex_texMixAmount;

void main(void)
{
    vec4 localPosition = vec4(a_position, 1.0);

    // todo: calc world transform from particle instance attribs
    // 2D rotation angle matrix
    mat4 matScale = mat4(1.0);
    matScale[0][0] = p_size.x;
    matScale[1][1] = p_size.y;
    matScale[2][2] = p_size.z;

    mat4 matRot2D = mat4(1.0);
    mat4 matRot3D = mat4(1.0);
    mat4 matTranslation = mat4(1.0);
    // 4th colume is translation?
    matTranslation[3] = vec4(p_position, 1.0);

    mat4 matView = u_view.matView;

    if(u_isBillboard > 0) {
        if (u_rotationLimit == NOLIMIT) {
            // discard rotation part of view matrix
            matView[0] = vec4(1.0, 0.0, 0.0, 0.0);
            matView[1] = vec4(0.0, 1.0, 0.0, 0.0);
            matView[2] = vec4(0.0, 0.0, 1.0, 0.0);
        } else {
            // todo: calc a local rotation matrix try to look at camera
            vec3 limitDir;
            if (u_rotationLimit == LIMIT_AXIS) {
                limitDir = u_limitAxis;
            } else if (u_rotationLimit == LIMIT_DIR) {
                // todo: divide by zero protect
                limitDir = normalize(p_direction);
            }
        }
    } else {


        // axis limit?
        // use lookat matrix?
    }

    // have nothing to do with object world transform.
    mat4 matWorld = matTranslation * matRot3D * matRot2D * matScale;

    vec4 worldPosition = matWorld * localPosition;
    vec4 viewPosition = matView * worldPosition;
    gl_Position = viewToProj(viewPosition);

    ex_color = u_object.color * p_color;

    // texcoord animation
    ex_texMixAmount = fract(p_frameIdx);
    float curFrame = floor(p_frameIdx);
    float nextFrame = curFrame + 1;
    vec2 curUV = a_texcoord0 + vec2(curFrame, 0.0);
    vec2 nextUV = a_texcoord0 + vec2(nextFrame, 0.0);

    vec2 uvScale = vec2(1.0, 1.0 / u_texAnimFrames);

    ex_texcoord0 = curUV * uvScale;
    ex_texcoord1 = nextUV * uvScale;
}

`;
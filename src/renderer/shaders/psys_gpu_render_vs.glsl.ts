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

out vec4 ex_color;          // if particle is dead, set alpha to zero then discard it in fs
out vec2 ex_texcoord0;       // for blend between two frames
out vec2 ex_texcoord1;       //

void main(void)
{
    vec4 worldPosition = vec4(0.);
    vec4 localPosition = vec4(a_position, 1.0);
    worldPosition = localToWorld(localPosition);
    gl_Position = viewToProj(worldToView(worldPosition));
    ex_color = u_object.color;
}

`;
/**
 * use GPU vertex transform feedback to update particles
 */
export default /** glsl */`
// version will be specified in js
// uniforms

// #include <uniforms_scene>
#include <uniforms_view>        // to get camera position and so on?
#include <uniforms_object>      // to get emitter posiiton and so on?

// elapsed time
uniform float u_elapsedTime;
// fix me: how to control the emit rate?
uniform float u_isEmitting;
uniform vec3 u_gravity;
uniform vec3 u_origin;          // position of emitter?
uniform vec4 u_emitDir_Variation;
// uniform float u_emitDirVariation;
uniform int u_texAnimFrameCount;
uniform vec2 u_lifeRange;
uniform vec2 u_speedRange;
uniform vec3 u_minSize;
uniform vec3 u_maxSize;
uniform int u_collision;

// fix me: 'isBillboard' flag have usage here? or in drawing program?

// particle system params


// particle instance vertex attributeS
// TODO: put into a header file?
#define POSITION_LOC 0
#define DIRECTION_LOC 1
#define UPDIR_LOC 2
#define AGE_LIFE_LOC 3
#define SEED_LOC 4
#define SIZE_LOC 5
#define COLOR_LOC 6
#define FRAME_INDEX_LOC 7
#define NOISE_TEXCOORD_LOC 8

layout(location = POSITION_LOC)     in vec3 p_position;
layout(location = DIRECTION_LOC)    in vec3 p_direction;
layout(location = UPDIR_LOC)        in vec3 p_upDir;
layout(location = AGE_LIFE_LOC)     in vec2 p_ageLife;
layout(location = SEED_LOC)         in vec4 p_seed;
layout(location = SIZE_LOC)         in vec3 p_size;
layout(location = COLOR_LOC)        in vec4 p_color;
layout(location = FRAME_INDEX_LOC)  in float p_frameIdx;
layout(location = NOISE_TEXCOORD_LOC) in vec2 p_noiseTexCoord;

#include <function_transforms>

// vertex output
out vec4 ex_color;

void main(void)
{
    vec4 worldPosition = vec4(0.);
    vec4 localPosition = vec4(a_position, 1.0);
    worldPosition = localToWorld(localPosition);
    gl_Position = viewToProj(worldToView(worldPosition));
    ex_color = u_object.color;
}

`;
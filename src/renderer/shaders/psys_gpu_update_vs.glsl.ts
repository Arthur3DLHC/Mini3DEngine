/**
 * use GPU vertex transform feedback to update particles
 */
export default /** glsl */`
// version will be specified in js
// uniforms

// #include <uniforms_scene>
#include <uniforms_view>        // to get camera position and so on?
#include <uniforms_object>      // to get emitter posiiton and so on?

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
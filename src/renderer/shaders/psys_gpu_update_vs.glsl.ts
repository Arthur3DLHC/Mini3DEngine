/**
 * use GPU vertex transform feedback to update particles
 * this is a simplified version of 
 * https://github.com/BabylonJS/Babylon.js/blob/master/src/Shaders/gpuUpdateParticles.vertex.fx
 */
export default /** glsl */`
// version and precision will be added in js

// uniforms

// #include <uniforms_scene>
#include <uniforms_view>        // to get camera position and so on?
#include <uniforms_object>      // to get emitter posiiton and so on?

// elapsed time
uniform float u_elapsedTime;
uniform vec3 u_gravity;

// particle system params
// fix me: how to control the emit rate?
uniform int u_isEmitting;
uniform vec3 u_origin;          // position of emitter?
uniform vec4 u_emitDir_variation;
// uniform float u_emitDirVariation;
uniform int u_texAnimFrameCount;
uniform vec2 u_lifeRange;
uniform vec2 u_speedRange;
uniform vec3 u_minSize;
uniform vec3 u_maxSize;
uniform int u_collision;

// fix me: 'isBillboard' flag have usage here? or in drawing program?

// particle instance vertex attributeS
// TODO: put these into a header file?
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
layout(location = DIRECTION_LOC)    in vec3 p_direction;    // unnormaled. actually, 'velocity'
layout(location = UPDIR_LOC)        in vec3 p_upDir;        // is this necessary?
layout(location = AGE_LIFE_LOC)     in vec2 p_ageLife;
layout(location = SEED_LOC)         in vec4 p_seed;
layout(location = SIZE_LOC)         in vec3 p_size;
layout(location = COLOR_LOC)        in vec4 p_color;
layout(location = FRAME_INDEX_LOC)  in float p_frameIdx;
layout(location = NOISE_TEXCOORD_LOC) in vec2 p_noiseTexCoord;

// #include <function_transforms>

// vertex output
// the position will output to gl_position
out vec3    ex_direction;    // unnormaled. actually, 'velocity'
out vec3    ex_upDir;
out vec2    ex_ageLife;
out vec4    ex_seed;
out vec3    ex_size;
out vec4    ex_color;
out float   ex_frameIdx;
out vec2    ex_noiseTexCoord;

void main(void)
{
    // check emit new particles
    // at very beginning, the age and life will both be zero, indicating all particles are dead particles
    // after first emiting, if a particle's age exceed it's life, we can treat it as dead again and emit as a new particle

    // if psys stop emitting, we discard all particles who's age > life when rendering
    float newAge = p_ageLife.x + u_elapsedTime;

    if (newAge > p_ageLife.y && u_isEmitting > 0) {
        vec3 newPosition;
        vec3 newDirection;

        // todo: get random value from random texture
        vec4 random;

        // age and life
        ex_ageLife.x = newAge - p_ageLife.y;
        ex_ageLife.y = mix(u_lifeRange.x, u_lifeRange.y, random.r);

        ex_seed = p_seed;

        // todo: size

        // todo: generate position according to the emitter shape and size

        // todo: generate direction by the u_emitDir_Variation

        gl_position = newPosition;
        ex_direction = newDirection;
    } else {
        // update this particle's velocity, position, direction...
        vec3 newDirection = p_direction + u_gravity * u_elapsedTime;
        ex_direction = newDirection;
        gl_position = p_position + newDirection;

        ex_ageLife = p_ageLife;
        ex_ageLife.x = newAge;

        ex_seed = p_seed;

        float ageGradient = newAge / ex_ageLife.y;

        // todo: calc size, color and frameIdx by ageGradient
    }
}

`;
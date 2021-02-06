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

#define EMITTER_ELLIPSOID  0
#define EMITTER_BOX        1

// elapsed time
uniform float   u_elapsedTime;
uniform vec3    u_gravity;

uniform float   u_curCount;             // current particle count (including respawned)

// particle system params
// fix me: how to control the emit rate?
uniform int     u_isEmitting;
// uniform vec3    u_origin;            // position of emitter?
uniform int     u_emitterShape;
// uniform vec3    u_emitterSize;          // local size in x, y, z axis
uniform mat4    u_emitterModelTransform;   // contains rotate, scale, translation already.

uniform vec4    u_emitDir_variation;    // xyz: emit dir (normalized dir)
                                        // w: dir variation

uniform vec4    u_texAnimFrameInfo;     // x: start frame
                                        // y: end frame
                                        // z: frame change speed
                                        // w: use random frame offset?

uniform vec2    u_lifeRange;            // x: min random life; y: max random life
uniform vec2    u_speedRange;           // x: min start speed; y: max start speed
uniform vec3    u_minSize;
uniform vec3    u_maxSize;
uniform int     u_collision;
// can assign random color when emitting?
uniform vec4    u_color1;
uniform vec4    u_color2;

uniform sampler2D s_sceneDepth;     // for collision detecting
uniform sampler2D s_sceneNormal;
uniform sampler2D s_randomTexture;

// particle instance vertex attributeS
// TODO: put these into a header file?
#define POSITION_LOC    0
#define DIRECTION_LOC   1
#define AGE_LIFE_LOC    2
#define SEED_LOC        3
#define SIZE_LOC        4
#define COLOR_LOC       5
#define FRAME_INDEX_LOC 6
// #define NOISE_TEXCOORD_LOC 7
// #define UPDIR_LOC       8

layout(location = POSITION_LOC)     in vec3 p_position;
layout(location = DIRECTION_LOC)    in vec3 p_direction;    // unnormaled. actually, 'velocity'
// layout(location = UPDIR_LOC)        in vec3 p_upDir;        // is this necessary?
layout(location = AGE_LIFE_LOC)     in vec2 p_ageLife;
layout(location = SEED_LOC)         in vec4 p_seed;
layout(location = SIZE_LOC)         in vec3 p_size;
layout(location = COLOR_LOC)        in vec4 p_color;
layout(location = FRAME_INDEX_LOC)  in float p_frameIdx;    // use a float value to enable blending between 2 frames
// layout(location = NOISE_TEXCOORD_LOC) in vec2 p_noiseTexCoord;

// #include <function_transforms>

// vertex output
// the position will output to gl_position
out vec3    ex_direction;    // unnormaled. actually, 'velocity'
// out vec3    ex_upDir;
out vec2    ex_ageLife;
out vec4    ex_seed;
out vec3    ex_size;
out vec4    ex_color;
out float   ex_frameIdx;
// out vec2    ex_noiseTexCoord;

vec3 getRandomVec3(float offset) {
    // babylon.js use two random textures;
    // is one texture OK?
    return texture(s_randomTexture, vec2(float(gl_vertexID) * offset / u_curCount, 0)).rgb;
}

vec4 getRandomVec4(float offset) {
    return texture(s_randomTexture, vec2(float(gl_vertexID) * offset / u_curCount, 0));
}

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
        vec4 random = getRandomVec4(p_seed.x);

        // age and life
        ex_ageLife.x = newAge - p_ageLife.y;
        ex_ageLife.y = mix(u_lifeRange.x, u_lifeRange.y, random.r);

        ex_seed = p_seed;

        // todo: size; random init size; gradient texture?
        ex_size = mix(u_minSize, u_maxSize, random.g);

        // todo: generate position according to the emitter shape and size
        // generate in local unit space, then assign emitter world transform.
        if (u_emitterShape == EMITTER_ELLIPSOID) {
            // random radius and polar coords?
        } else if (u_emitterShape == EMITTER_BOX) {
            // random xyz
            newPosition = getRandomVec3(p_seed.y);
        }

        // random color
        ex_color = mix(u_color1, u_color2, random.b);

        // animation frame index
        ex_frameIdx = u_texAnimFrameInfo.x;
        if(u_texAnimFrameInfo.w > 0.5) {
            // support random start index? for effects like fire...
            ex_frameIdx = mix(u_texAnimFrameInfo.x, u_texAnimFrameInfo.y, random.a);
        }

        // todo: nose texture?

        // generate local direction by the u_emitDir_variation
        newDirection = u_emitDir_variation.xyz + getRandomVec3(p_seed.z) * u_emitDir_variation.w;
        newDirection *= mix(u_speedRange.x, u_speedRange.y, random.a);

        // transform them to world space
        newPosition = (u_emitterModelTransform * vec4(newPosition, 1.0)).xyz;
        newDirection = (u_emitterModelTransform * vec4(newDirection, 0.0)).xyz;

        gl_position = newPosition;
        ex_direction = newDirection;
    } else {
        // update this particle's velocity, position, direction...
        vec3 newDirection = p_direction + u_gravity * u_elapsedTime;
        ex_direction = newDirection;
        gl_position = p_position + newDirection * u_elapsedTime;

        ex_ageLife = p_ageLife;
        ex_ageLife.x = newAge;

        ex_seed = p_seed;

        float ageGradient = newAge / ex_ageLife.y;

        // todo: calc size, color and frameIdx by ageGradient
        ex_color = p_color;
        ex_size = p_size;
        ex_frameIdx = p_frameIdx + u_texAnimFrameInfo.z * u_elapsedTime;
        if(ex_frameIdx > u_texAnimFrameInfo.y) ex_frameIdx = u_texAnimFrameInfo.x;
    }
}

`;
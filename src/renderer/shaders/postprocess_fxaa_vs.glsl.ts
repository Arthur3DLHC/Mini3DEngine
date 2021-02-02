/**
 * fxaa vertex shader
 * mostly from babylon.js
 * https://github.com/BabylonJS/Babylon.js/blob/master/src/Shaders/fxaa.vertex.fx
 * with some modifications
 */
export default /** glsl */`
#include <attrib_locations>

// uniforms
// #include <uniforms_scene>
#include <uniforms_view>
#include <uniforms_object>

uniform vec2 u_texelSize;

// vertex attribute
// 使用<attribs>规定的vertex attribute
layout(location = POSITION_LOCATION) in vec3 a_position;
layout(location = TEXCOORD0_LOCATION)in vec2 a_texcoord0;

// todo: include common funcitons?
#include <function_transforms>

// vertex output
out vec2 ex_texcoord;
out vec2 ex_texcoordS;
out vec2 ex_texcoordE;
out vec2 ex_texcoordN;
out vec2 ex_texcoordW;
out vec2 ex_texcoordNW;
out vec2 ex_texcoordSE;
out vec2 ex_texcoordNE;
out vec2 ex_texcoordSW;

void main(void)
{
    // todo: transform the rectangle by world matrix only (to set the size and position on screen)
    // use a plane geometry ( x 0 z plane ), so need to swap y and z
    gl_Position = vec4(a_position.xzy, 1.0);
    ex_texcoord = a_texcoord0;
    
    ex_texcoordS = a_texcoord0 + vec2( 0.0, 1.0) * u_texelSize;
    ex_texcoordE = a_texcoord0 + vec2( 1.0, 0.0) * u_texelSize;
    ex_texcoordN = a_texcoord0 + vec2( 0.0,-1.0) * u_texelSize;
    ex_texcoordW = a_texcoord0 + vec2(-1.0, 0.0) * u_texelSize;

    ex_texcoordNW = a_texcoord0 + vec2(-1.0,-1.0) * u_texelSize;
    ex_texcoordSE = a_texcoord0 + vec2( 1.0, 1.0) * u_texelSize;
    ex_texcoordNE = a_texcoord0 + vec2( 1.0,-1.0) * u_texelSize;
    ex_texcoordSW = a_texcoord0 + vec2(-1.0, 1.0) * u_texelSize;
}

`;
/**
 * copy object tag and id, normal, depth from scene maps to picking RT
 */
export default /** glsl */`
// todo: 在 js 中统一指定 version?
// uniforms
// #include <uniforms_scene>
uniform mat4 u_matWorld;
uniform vec4 u_texcoordScaleOffset;

// vertex attribute
// 使用<attribs>规定的vertex attribute
in vec3 a_position;
in vec2 a_texcoord0;

// vertex output
out vec2 ex_texcoord;

void main(void)
{
    // todo: transform the rectangle by world matrix only (to set the size and position on screen)
    // use a plane geometry ( x 0 z plane ), so need to swap y and z
    gl_Position = u_matWorld * vec4(a_position.xzy, 1.0);
    ex_texcoord = a_texcoord0 * u_texcoordScaleOffset.xy + u_texcoordScaleOffset.zw;
}

`;
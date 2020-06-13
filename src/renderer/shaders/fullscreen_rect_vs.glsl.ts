/**
 * full screen rect. used by post processes
 */
export default /** glsl */`
// no transform matrix uniforms needed

// vertex attribute
// 使用<attribs>规定的vertex attribute
in vec3 a_position;
in vec2 a_texcoord0;

// vertex output
out vec2 ex_texcoord;

void main(void)
{
    // use a plane geometry; need to swap y and z
    gl_Position = vec4(a_position.xzy, 1.0);
    ex_texcoord = a_texcoord0;
}
`;

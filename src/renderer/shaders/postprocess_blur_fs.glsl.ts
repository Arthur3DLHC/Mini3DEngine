/**
 * 1D gaussian blur shader for post processes
 * https://learnopengl.com/Advanced-Lighting/Bloom
 */
export default /** glsl */`
uniform sampler2D s_source;
// uniform float u_blurRadius;
uniform vec2 u_direction;   // horiz (blurRadius, 0.0) or vertical (0.0, blurRadius)
// todo: gaussian kernels?
// hardcode here or pass in?
in vec2 ex_texcoord;
layout(location = 0) out vec4 o_color;

void main(void) {
    o_color = texture(s_source, ex_texcoord);
}

`;
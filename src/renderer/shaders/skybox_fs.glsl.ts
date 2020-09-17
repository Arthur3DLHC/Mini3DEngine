/**
 * scene sky box shader
 */
export default /** glsl */`
precision mediump samplerCube;

#include <uniforms_object>

uniform samplerCube s_skybox;

in vec3 ex_worldDir;
in vec3 ex_normal;
in vec2 ex_texcoord;

#include <output_final>

void main(void) {
    vec4 texColor = texture(s_skybox, ex_worldDir);

    FinalOutput o = defaultFinalOutput();

    //o.color = vec4(1.0, 0.0, 0.0, 1.0);
    o.color = texColor * u_object.color;
    o.normal = vec3(0.0, 0.0, 1.0);
    o.specular = vec3(0.0);
    o.roughness = 1.0;

    outputFinal(o);
}

`;
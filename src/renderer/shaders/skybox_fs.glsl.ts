/**
 * scene sky box shader
 */
export default /** glsl */`
precision lowp samplerCube;

uniform samplerCube s_skybox;

in vec3 ex_worldDir;
#include <output_final>

void main(void) {
    vec4 texColor = texture(s_skybox, ex_worldDir);

    FinalOutput o = defaultFinalOutput();

    o.color = texColor;
    o.normal = vec3(0.0, 0.0, 1.0);
    o.specular = vec3(0.0);
    o.roughness = 1.0;

    outputFinal(o);
}

`;
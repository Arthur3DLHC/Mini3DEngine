/**
 * scene sky box shader
 */
export default /** glsl */`
precision mediump samplerCube;

#include <uniforms_object>

uniform samplerCube s_skybox;

#define u_isHDR     u_object.props.w

in vec3 ex_worldDir;
in vec3 ex_normal;
in vec2 ex_texcoord;

#include <output_final>

void main(void) {
    vec4 texColor = texture(s_skybox, ex_worldDir);
    if (u_isHDR == 1.0) {
        texColor.rgb *= pow(2.0, texColor.a * 255.0 - 128.0);
        texColor.a = 1.0;
    }

    FinalOutput o = defaultFinalOutput();

    //o.color = vec4(1.0, 0.0, 0.0, 1.0);
    o.color = texColor * u_object.color;
    o.normal = vec3(0.0, 0.0, 1.0);
    o.specular = vec3(0.0);
    o.roughness = 1.0;
    o.tag = getObjectTag();

    outputFinal(o);
}

`;
/**
 * a textured screen space rectangle shader
 */
export default /** glsl */`
precision mediump sampler2DShadow;
precision lowp samplerCube;
precision lowp sampler2DArray;
precision lowp sampler3D;

// #include <uniforms_scene>
#include <uniforms_view>
#include <uniforms_object>
// #include <uniforms_mtl_pbr>

// support different sampler types
uniform int                 u_textureType;  // 0: 2D, 1: 2DArray, 2: Cube, 3: 3D 

uniform sampler2D           s_tex2D;
uniform sampler2DArray      s_tex2DArray;
uniform samplerCube         s_texCube;
uniform sampler3D           s_tex3D;

#include <output_final>
in vec4 ex_color;
in vec2 ex_texcoord;
void main(void)
{
    FinalOutput o = defaultFinalOutput();
    vec4 texColor = vec4(1.0);
    if(u_textureType == 0) {    
        texColor = texture(s_tex2D, ex_texcoord);
        // texColor = vec4(0, 0, 0, 1);
    } else if(u_textureType == 1) {
        texColor = texture(s_tex2DArray, vec3(ex_texcoord, 0));
        // texColor = vec4(1, 0, 0, 1);
    } else if(u_textureType == 2) {
        // fix me: cube map
        texColor = vec4(0, 1, 0, 1);
    } else if(u_textureType == 3) {
        // texColor = texture(s_tex3D, vec3(ex_texcoord, 0));
        texColor = vec4(0, 0, 1, 1);
    }
    o.color = texColor;
    // o.color = mix(ex_color, texColor, u_material.colorMapAmount);
    // o.color.a = 1.0;

    outputFinal(o);
}
`;
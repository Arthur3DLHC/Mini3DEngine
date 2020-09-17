/**
 * a textured screen space rectangle shader
 */
export default /** glsl */`
precision mediump sampler2DShadow;
precision mediump samplerCube;
precision mediump sampler2DArray;
precision mediump sampler3D;

// #include <uniforms_scene>
#include <uniforms_view>
#include <uniforms_object>
// #include <uniforms_mtl_pbr>

// support different sampler types
uniform int                 u_texType;  // 0: 2D, 1: 2DArray, 2: Cube, 3: 3D 
uniform float               u_texlayer; // tex layer for 2DArray or 3D
uniform float               u_texLevel; // mip level

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
    if(u_texType == 0) {    
        texColor = textureLod(s_tex2D, ex_texcoord, u_texLevel);
        // texColor = vec4(0, 0, 0, 1);
    } else if(u_texType == 1) {
        texColor = textureLod(s_tex2DArray, vec3(ex_texcoord, u_texlayer), u_texLevel);
        // texColor = vec4(1, 0, 0, 1);
    } else if(u_texType == 2) {
        // fix me: cube map
        texColor = vec4(0, 1, 0, 1);
    } else if(u_texType == 3) {
        // texColor = texture(s_tex3D, vec3(ex_texcoord, u_texlayer));
        texColor = vec4(0, 0, 1, 1);
    }
    o.color = texColor;
    // o.color = mix(ex_color, texColor, u_material.colorMapAmount);
    // o.color.a = 1.0;

    outputFinal(o);
}
`;
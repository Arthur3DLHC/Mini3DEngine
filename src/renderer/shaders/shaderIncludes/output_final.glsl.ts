/**
 * final mrt output
 */
export default /** glsl */`
    struct FinalOutput
    {
        vec4 color;
        vec4 subsurfaceColor;       // output to subsurface target
        float subsurface;
        float roughness;            // for screen space reflection
        vec3 specular;             // F. Note: metals have specular color.
        vec3 normal;                // output to thin G-Buffer
        // 使用 depth texture 反算线性深度？就不用输出depth了？
    };

    FinalOutput defaultFinalOutput()
    {
        FinalOutput o;
        o.color = vec4(0,0,0,1);
        o.subsurfaceColor = vec4(0,0,0,0);
        o.subsurface = 0.0;
        o.roughness = 0.5;
        o.specular = vec3(0.02);
        o.normal = vec3(0,0,1);
        return o;
    }

    layout(location = 0) out vec4 o_color;
    layout(location = 1) out vec4 o_normal;
    layout(location = 2) out vec4 o_specularRoughness;
    // todo: subsurface?

    void outputFinal(FinalOutput o)
    {
        o_color = o.color;
        o_normal = vec4(o.normal, 1.0);
        o_specularRoughness = vec4(o.specular, o.roughness);
    }
`;
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
        float metallic;
        vec3 normal;                // output to thin G-Buffer
        // 使用 depth texture 反算线性深度？就不用输出depth了？
    };

    FinalOutput defaultFinalOutput()
    {
        FinalOutput o;
        o.color = vec4(0,0,0,0);
        o.subsurfaceColor = vec4(0,0,0,0);
        o.subsurface = 0;
        o.roughness = 0.5;
        o.metallic = 0;
        o.normal = vec3(0,0,1);
        return o;
    }

    void outputFinal(FinalOutput o)
    {
        gl_FragData[0] = o.color;
        // TODO: other render targets
    }
`;
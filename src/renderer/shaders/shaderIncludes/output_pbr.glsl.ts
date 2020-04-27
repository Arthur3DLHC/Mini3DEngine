/**
 * todo: define common pbr outputs
 */
export default /** glsl */`
    struct PBROutput
    {
        vec4 baseColor;
        vec4 emissive;
        vec4 subsurfaceColor;       // output to subsurface target
        float subsurface;
        float metallic;
        float roughness;
        vec3 normal;
    };
    // todo: function for default output
    PBROutput defaultPBROutput()
    {
        PBROutput o;
        o.baseColor = vec4(0,0,0,0);
        o.emissive = vec4(0,0,0,0);
        o.subsurfaceColor = vec4(0,0,0,0);
        o.subsurface = 0;
        o.metallic = 0;
        o.roughness = 0.5;
        o.normal = vec3(0, 0, 1);
        return o;
    }
`;
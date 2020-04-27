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
`;
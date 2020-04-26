/**
 * uniform block for default pbr material
 */
export default /** glsl */`
    layout (std140) uniform Material
    {
        // 各种不同的材质的 shader，其中的布局不同
        // 这里列举的是基本 PBR 材质的uniforms
        vec4 baseColor;
        vec4 emissive;
        float metallic;
        float roughness;
        float colorMapAmount;
        float metallicMapAmount;
        float roughnessMapAmount;
        float normalMapAmount;
        float occlusionMapAmount;
        float emissiveMapAmount;
        // 注意: sampler 不能放在uniform block里
        vec3 subsurfaceColor;
        float subsurface;
    } u_material;
`;
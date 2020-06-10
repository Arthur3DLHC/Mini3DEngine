/**
 * common IBL functions
 * https://github.com/KhronosGroup/glTF-Sample-Viewer
 */
export default /** glsl */`
#define DIFFUSE_MIP_LEVEL   5.0

// diffuseColor is (1 - F) * (1 - metalic)
vec3 getIBLRadianceLambertian(sampler2DArray s, int layer, vec3 n, vec3 diffuseColor)
{
    vec3 diffuseLight = textureCubeArrayLod(s, n, layer, DIFFUSE_MIP_LEVEL).rgb;

    //#ifndef USE_HDR
    //    diffuseLight = sRGBToLinear(diffuseLight);
    //#endif

    return diffuseLight * diffuseColor;
}
`;
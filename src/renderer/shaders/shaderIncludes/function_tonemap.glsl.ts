/**
 * tone mapping functions
 */
export default /** glsl */`
// https://blog.csdn.net/z18636930051/article/details/79528753
// todo: consider to put this to function_postprocess
vec3 ACESToneMapping(vec3 color, float adapted_lum)
{
    const float A = 2.51;
    const float B = 0.03;
    const float C = 2.43;
    const float D = 0.59;
    const float E = 0.14;
    color *= adapted_lum;
    return (color * (A * color + B)) / (color * (C * color + D) + E);
}
`;
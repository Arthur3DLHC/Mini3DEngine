/**
 * common IBL functions
 * https://github.com/KhronosGroup/glTF-Sample-Viewer
 * https://blog.csdn.net/i_dovelemon/article/details/79251920
 */
export default /** glsl */`
const float MAX_SPECULAR_MIP_LEVEL = 4.0;       // specular mip level: 0 ~ 4 include 4
const float DIFFUSE_MIP_LEVEL = 5.0;
const float PI = 3.1415926536898;

// diffuseColor is (1 - F) * (1 - metalic)
vec3 getIBLRadianceLambertian(sampler2DArray s, int envmapIdx, vec3 n, vec3 diffuseColor)
{
    // todo: use HL2 ambient cube
    vec3 diffuseLight = textureCubeArrayLod(s, n, envmapIdx, DIFFUSE_MIP_LEVEL).rgb;

    

    // vec3 diffuseLight = textureCubeArrayLod(s, n, envmapIdx, 1.0).rgb;

    //#ifndef USE_HDR
    //    diffuseLight = sRGBToLinear(diffuseLight);
    //#endif

    return diffuseLight * diffuseColor;
}

float radicalInverse(uint bits) {
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10f;
}

vec2 hammersley(uint i, uint N) {
    return vec2(float(i) / float(N), radicalInverse(i));
}

vec3 importanceSamplingGGX(vec2 xi, float roughness, vec3 n) {
    float a = roughness * roughness;

    float phi = 2.0 * PI * xi.x;
    float costheta = sqrt((1.0 - xi.y) / (1.0 + (a * a - 1.0) * xi.y));
    float sintheta = sqrt(1.0 - costheta * costheta);

    vec3 h = vec3(0.0, 0.0, 0.0);
    h.x = sintheta * cos(phi);
    h.y = sintheta * sin(phi);
    h.z = costheta;

    vec3 up = abs(n.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 tx = normalize(cross(up, n));
    vec3 ty = cross(n, tx);

    return tx * h.x + ty * h.y + n * h.z;
}

float calcGeometryGGXIBL(float costheta, float roughness) {
    float a = roughness * roughness;
    float k = a / 2.0;

    float t = costheta * (1.0 - k) + k;

    return costheta / t;
}

float calcGeometrySmithIBL(vec3 n, vec3 v, vec3 l, float roughness) {
    float ndotv = max(dot(n, v), 0.0);
    float ndotl = max(dot(n, l), 0.0);
    float ggx1 = calcGeometryGGXIBL(ndotv, roughness);
    float ggx2 = calcGeometryGGXIBL(ndotl, roughness);
    return ggx1 * ggx2;    
}

`;
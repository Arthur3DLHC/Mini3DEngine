/**
 * uniform blocks per scene
 */
export default /** glsl */`
    #define MAX_NUM_LIGHTS  512
    #define MAX_NUM_DECALS  1024
    #define MAX_NUM_ENVPROBES  1024
    #define MAX_NUM_IRRADIANCE_VOLUMES  1024
    
    struct Light {
        uint type;
        vec3 color;
        mat4x3 transform;   // point/dir/spot
        float radius;       // point/dir/spot
        float angle;        // spot
        float penumbra;     // spot
        vec4 shadowMapRect; // dir/spot
    };
    layout (std140) uniform Lights
    {
        Light lights[MAX_NUM_LIGHTS];
    } u_lights;

    struct Decal {
        mat4x3 transform;
        vec4 decalMapRect;  // 在图集中的位置
    };
    layout (std140) uniform Decals
    {
        Decal decals[MAX_NUM_DECALS];
    } u_decals;

    struct EnvProbe {
        vec3 position;      // always xyz axis aligned
        uint cubeMapIndex;  // start index for 6 faces in texture array
    };
    layout (std140) uniform EnvProbes
    {
        EnvProbe probes[MAX_NUM_ENVPROBES];
    } u_envProbes;

    struct IrradianceVolume {
        mat4x3 transform;
        vec3 boxMin;         // irradiance volume 三维图集中的盒子最小角
        vec3 boxMax;         // irradiance volume 三维图集中的盒子最小角
    };
    layout (std140) uniform IrrVolumes
    {
        IrradianceVolume volumes[MAX_NUM_IRRADIANCE_VOLUMES];
    } u_irrVolumes;
`;
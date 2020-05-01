/**
 * uniform blocks per scene
 */
export default /** glsl */`
    #define MAX_LIGHTS_PERSCENE  512
    #define MAX_DECALS_PERSCENE  1024
    #define MAX_ENVPROBES_PERSCENE  1024
    #define MAX_IRRADIANCE_VOLUMES_PERSCENE  512
    
    struct Light {
        float type;          // Fix me: js 中能把整数放在Float32Array中吗？如果不能，这里需要改为float类型
        vec3 color;
        mat4x3 transform;   // point/dir/spot
        float radius;       // point/dir/spot
        float angle;        // spot
        float penumbra;     // spot
        float unused;       // alignment
        vec4 shadowMapRect; // dir/spot
    };
    layout (std140) uniform Lights
    {
        Light lights[MAX_LIGHTS_PERSCENE];
    } u_lights;

    struct Decal {
        mat4x3 transform;
        vec4 decalMapRect;  // 在图集中的位置
    };
    layout (std140) uniform Decals
    {
        Decal decals[MAX_DECALS_PERSCENE];
    } u_decals;

    struct EnvProbe {
        vec3 position;      // always xyz axis aligned
        uint cubeMapIndex;  // start index for 6 faces in texture array
                            // Fix me: js中能把整数放在Float32Array中吗？如果不能，这里需要改为float类型
    };
    layout (std140) uniform EnvProbes
    {
        EnvProbe probes[MAX_ENVPROBES_PERSCENE];
    } u_envProbes;

    struct IrradianceVolume {
        mat4x3 transform;
        vec4 boxMin;         // irradiance volume 三维图集中的盒子最小角
        vec4 boxMax;         // irradiance volume 三维图集中的盒子最小角
    };
    layout (std140) uniform IrrVolumes
    {
        IrradianceVolume volumes[MAX_IRRADIANCE_VOLUMES_PERSCENE];
    } u_irrVolumes;
`;
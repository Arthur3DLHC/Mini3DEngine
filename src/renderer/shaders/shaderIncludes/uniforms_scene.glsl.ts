/**
 * uniform blocks per scene
 */
export default /** glsl */`
    #define MAX_LIGHTS_PERSCENE  512
    #define MAX_DECALS_PERSCENE  512
    #define MAX_ENVPROBES_PERSCENE  512
    #define MAX_IRRADIANCE_VOLUMES_PERSCENE  512
    
    layout (std140, column_major) uniform; 

    struct Light {
        vec4 color;
        mat4 transform;     
        vec4 properties;      // pack following props to a vec4
        //float type;         // light type
        //float radius;       // point/dir/spot
        //float outerConeCos; // spot
        //float innerConeCos; // spot
        vec4 shadowMapRect;   // dir/spot
        // fix me: need to add shadow proj matrix?
    };
    uniform Lights
    {
        Light lights[MAX_LIGHTS_PERSCENE];
    } u_lights;

    struct Decal {
        mat4 transform;
        vec4 decalMapRect;  // 在图集中的位置
    };
    uniform Decals
    {
        Decal decals[MAX_DECALS_PERSCENE];
    } u_decals;

    struct EnvProbe {
        vec3 position;      // always xyz axis aligned
        float cubeMapIndex;  // start index for 6 faces in texture array
                            // Fix me: js中能把整数放在Float32Array中吗？如果不能，这里需要改为float类型
    };
    uniform EnvProbes
    {
        EnvProbe probes[MAX_ENVPROBES_PERSCENE];
    } u_envProbes;

    struct IrradianceVolume {
        mat4 transform;
        vec4 boxMin;         // irradiance volume 三维图集中的盒子最小角
        vec4 boxMax;         // irradiance volume 三维图集中的盒子最小角
    };
    uniform IrrVolumes
    {
        IrradianceVolume volumes[MAX_IRRADIANCE_VOLUMES_PERSCENE];
    } u_irrVolumes;
`;
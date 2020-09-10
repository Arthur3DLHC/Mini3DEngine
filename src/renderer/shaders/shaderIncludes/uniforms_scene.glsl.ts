/**
 * uniform blocks per scene
 */
export default /** glsl */`
    #define MAX_LIGHTS_PERSCENE  256
    #define MAX_DECALS_PERSCENE  512
    #define MAX_ENVPROBES_PERSCENE  128
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
        mat4 matShadow;       // dir/spot; light viewport(atlas location) * frustum proj * light view (inv transform)
                              // if all zero, light do not cast shadow ?
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
        float radius;       // radius
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

    // dithering pattern?
    uniform DitherPattern {
        mat4 randX;             // 4 x 4 随机值，0.0 ~ 1.0
        mat4 randY;             // 4 x 4 随机值，0.0 ~ 1.0
    } u_ditherPattern;
`;
/**
 * uniform blocks per scene
 */
export default /** glsl */`
    #define MAX_LIGHTS_PERSCENE  256
    #define MAX_DECALS_PERSCENE  512
    #define MAX_ENVPROBES_PERSCENE  128
    #define MAX_IRRPROBES_PERSCENE  512
    
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
        float radius;       // probes with smaller radius has higher priority than larger ones
        vec4 visibleRange;  // the visibility is affected by the distance from camera and the visible range of the probe
                            // use vec2 to fit the UBO alignment 
    };
    uniform EnvProbes
    {
        EnvProbe probes[MAX_ENVPROBES_PERSCENE];
    } u_envProbes;

    struct IrradianceProbe {
        vec3 position;          // alwayx xyz axis aligned
        float radius;
        // mat4 transform;
        // vec4 boxMin;         // irradiance volume 三维图集中的盒子最小角
        // vec4 boxMax;         // irradiance volume 三维图集中的盒子最小角
    };
    uniform IrrProbes
    {
        IrradianceProbe probes[MAX_IRRPROBES_PERSCENE];
    } u_irrProbes;

    // dithering pattern?
    uniform DitherPattern {
        mat4 randX;             // 4 x 4 随机值，0.0 ~ 1.0
        mat4 randY;             // 4 x 4 随机值，0.0 ~ 1.0
    } u_ditherPattern;
`;
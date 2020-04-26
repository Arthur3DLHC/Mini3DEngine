/**
 * uniform block per object
 */
export default /** glsl */`
    #define MAX_BONES       256
    layout (std140) uniform Object
    {
        mat4 matWorld;
        mat4 matPrevWorld;
        vec4 color;     // or use colortint and coloradd?
        float tag; 
        mat4x3 matBones[MAX_BONES];
        mat4x3 matPrevBones[MAX_BONES];
    } u_object;
    // fix me: 是否可以统一用一个 uniform block？避免block过多
    /*
    layout (std140) uniform ObjectSkin
    {

        vec4 color;     // or use colortint and coloradd?
        float tag; 
    } u_objectSkin;
    */
`;
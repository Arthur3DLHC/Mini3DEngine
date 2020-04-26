/**
 * uniform block per object
 */
export default /** glsl */`
    layout (std140) uniform Object
    {
        mat4 matWorld;
        mat4 matPrevWorld;
        vec4 color;     // or use colortint and coloradd?
        float tag; 
    } u_object;
    #define MAX_BONES       256
    layout (std140) uniform ObjectSkin
    {
        mat4x3 matBones[MAX_BONES];
        mat4x3 matPrevBones[MAX_BONES];
        vec4 color;     // or use colortint and coloradd?
        float tag; 
    } u_objectSkin;
`;
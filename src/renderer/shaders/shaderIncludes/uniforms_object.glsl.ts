/**
 * uniform block per object
 */
export default /** glsl */`
    #define MAX_BONES       256
    layout (std140, column_major) uniform; 
    uniform Object
    {
        mat4 matWorld;
        mat4 matWorldPrev;
        vec4 color;     // or use colortint and coloradd?
        vec4 props;     // x: tag(objectID) y: numBones z: instanced w: custom flags
        mat4 matBones[MAX_BONES];
        mat4 matBonesPrev[MAX_BONES];

    } u_object;

    float getObjectTag()
    {
        return u_object.props.x;
    }
`;
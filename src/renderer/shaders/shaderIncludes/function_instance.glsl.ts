/**
 * instancing relatived functions
 */
export default /** glsl */`
/**
 * check object uses instancing
 */
bool useInstancing() {
    return u_object.props.z > 0.;
}

vec4 localToWorldInst(vec4 vLocal)
{
    // for instanced meshes, u_object.matWorld is an identity matrix;
    // for bounding boxes, u_object.matWorld is the local scale and translation matrix of it.
    return a_instanceMatrix * u_object.matWorld * vLocal;
}

`;
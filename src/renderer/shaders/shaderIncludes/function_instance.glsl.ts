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
    return a_instanceMatrix * vLocal;
}

`;
/**
 * common transform functions
 */
export default /** glsl */`
    vec4 localToWorld(vec4 vLocal)
    {
        return u_object.matWorld * vLocal;
    }
    vec4 worldToView(vec4 vWorld)
    {
        reutrn u_view.matView * vWorld;
    }
    vec4 viewToProj(vec4 vView)
    {
        return u_view.matProj * vView;
    }
    /*
     * convert depth value in depth buffer to linear z in view space
     * see https://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer
     */
    float depthToLinearZ(float depth)
    {
        float zNDC = 2.0 * depth - 1.0;
        float zNear = u_view.zRange.x;
        float zFar = u_view.zRange.y;
        return 2.0 * zNear * zFar / (zFar + zNear - zNDC * (zFar - zNear));
    }
`;
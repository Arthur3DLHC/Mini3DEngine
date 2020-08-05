/**
 * common transform functions
 */
export default /** glsl */`
    vec4 localToWorld(vec4 vLocal)
    {
#ifdef USE_SKINNING

        mat4 matSkin = getSkinningMatrix();
        vLocal = matSkin * vLocal;

#endif 
        return u_object.matWorld * vLocal;
    }
    vec4 worldToView(vec4 vWorld)
    {
        return u_view.matView * vWorld;
    }
    vec4 viewToProj(vec4 vView)
    {
        return u_view.matProj * vView;
    }

`;
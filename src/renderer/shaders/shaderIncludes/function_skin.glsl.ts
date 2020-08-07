/**
 * skinning transform functions
 */
export default /** glsl */`
    /**
     * check object uses skinning
     */
    bool useSkinning() {
        return u_object.props.y > 0.;
    }

    mat4 getSkinningMatrix() {
        mat4 skin = mat4(0.0);
        skin += a_weights0.x * u_object.matBones[int(a_joints0.x)] +
                a_weights0.y * u_object.matBones[int(a_joints0.y)] +
                a_weights0.z * u_object.matBones[int(a_joints0.z)] +
                a_weights0.w * u_object.matBones[int(a_joints0.w)];
        return skin;
    }

    vec4 localToWorldCheckSkin(vec4 vLocal)
    {
// #ifdef USE_SKINNING
        if(useSkinning()) {
            mat4 matSkin = getSkinningMatrix();
            return matSkin * vLocal;
        }

        
// #else
        else {
            return u_object.matWorld * vLocal;
        }

//#endif 
    }

    // mat4 getSkinningNormalMatrix() {
    //     mat4 skin = mat4(0.0);
    //     // todo: pass in normal matrices for mesh
    //     return skin;
    // }
`;
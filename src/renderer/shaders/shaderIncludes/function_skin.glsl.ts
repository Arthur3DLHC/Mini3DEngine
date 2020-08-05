/**
 * skinning transform functions
 */
export default /** glsl */`
    mat4 getSkinningMatrix() {
        mat4 skin = mat4(0.0);
        skin += a_weights0.x * u_object.matBones[int(a_joints0.x)] +
                a_weights0.y * u_object.matBones[int(a_joints0.y)] +
                a_weights0.z * u_object.matBones[int(a_joints0.z)] +
                a_weights0.w * u_object.matBones[int(a_joints0.w)];
        return skin;
    }

    mat4 getSkinningNormalMatrix() {
        mat4 skin = mat4(0.0);
        // todo: pass in normal matrices for mesh
        return skin;
    }
`;
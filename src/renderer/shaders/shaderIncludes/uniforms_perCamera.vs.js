/**
 * todo: define uniform buffer layout
 */
export default /** glsl */`
    layout (std140) uniform Camera
    {
        vec3 position;
        float layer;
        vec4 viewport;
        vec4 matView;
        vec4 matProj;
    } u_Camera;
`;
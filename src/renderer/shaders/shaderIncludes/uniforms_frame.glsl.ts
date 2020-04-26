/**
 * uniform block per frame
 */
export default /** glsl */`
    layout (std140) uniform Frame
    {
        float time;
        // todo: other time values?
    } u_frame;
`;
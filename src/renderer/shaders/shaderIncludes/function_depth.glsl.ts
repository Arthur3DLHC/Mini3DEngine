/**
 * common depth buffer related functions
 */
export default /** glsl */`
    // this is from three.js. why these formulars are different, and which one is right?
    // -- this formular is simplfied version of the one in depthToLinearZ funciton.
    // three.js is a great API.
    /*
     * from perspective depth buffer value to view space Z
     */
    float perspectiveDepthToViewZ(float depth, float near, float far) {
        return ( near * far ) / ( ( far - near ) * depth - far );
    }

    /*
     * from view space Z to a orthographic linear depth
     */
    float viewZToOrthoDepth(float viewZ, float near, float far) {
        return ( viewZ + near ) / ( near - far );
    }

    /*
     * convert depth value in depth buffer to linear z in view space
     * see https://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer
     * fix me: need to handle perspective and othographic diferrently
     */
    /*
    float depthToLinearZ(float depth)
    {
        float zNDC = 2.0 * depth - 1.0;
        float zNear = u_view.zRange.x;
        float zFar = u_view.zRange.y;
        return 2.0 * zNear * zFar / (zFar + zNear - zNDC * (zFar - zNear));
    }

    // this may not safe for non sym perspective projections.
    float depthToLinearZ(float depth) {
        // is perspective?
        depth = depth * 2.0 - 1.0;
        if (u_view.matProj[3][3] == 0.0) {
            // Perspective
            return u_view.matProj[3][2] / (depth * u_view.matProj[2][3] - u_view.matProj[2][2]);
        }
        else {
            // Symmetrical orthographic
            // PENDING
            return (depth - u_view.matProj[3][2]) / u_view.matProj[2][2];
        }
    }
    */
`;
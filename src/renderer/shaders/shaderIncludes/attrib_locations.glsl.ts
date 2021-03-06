/**
 * common vertex shader inputs
 * compatible with gltf model
 */
export default /** glsl */`

// geometry attributes
#define POSITION_LOCATION 0
#define NORMAL_LOCATION 1
#define TANGENT_LOCATION 2
#define TEXCOORD0_LOCATION 3
#define TEXCOORD1_LOCATION 4
#define JOINTS0_LOCATION 5
#define WEIGHTS0_LOCATION 6
#define COLOR0_LOCATION 7

// instance attributes
#define INSTANCE_MATRIX_LOCATION 8
#define INSTANCE_COLOR_LOCATION 12

// actually, you can use above location for your custom input while they are not used.
#define CUSTOM_LOCATION 13

`;
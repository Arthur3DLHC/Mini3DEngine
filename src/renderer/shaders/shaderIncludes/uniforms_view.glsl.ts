/**
 * todo: define uniform buffer layout
 */
export default /** glsl */`
    layout (std140) uniform View
    {
        mat4 matView;
        mat4 matViewPrev;
        mat4 matProj;
        mat4 matProjPrev;
        vec4 viewport;          // x, y, width, height
        vec3 position;
        vec2 zRange;            // near, far
        vec2 rtSize;            // render target full size, in pixels
        vec4 farRect;           // far plane left, bottom, right, top
    } u_view;

    #define MAX_ITEMS_PERVIEW   4096

    layout (std140) uniform ItemIndices
    {
        int indices[MAX_ITEMS_PERVIEW]; // 一个int数组，其中按每个cluster顺序保存了其中所有光源索引，decal索引，envProbe索引，irradiance volume索引
    } u_itemIndices;

    #define NUM_CLUSTERS_PERVIEW   3072 (16*8*24)

    struct Cluster {

        // fix me: 按照这个尺寸，会超过 16384 个 byte 的限制
        // 需要进一步压缩，比如拆成16位？
        // ivec2 lightOffsetCount;     // itemIndices中的起始偏移量和个数
        // ivec2 decalOffsetCount;
        // ivec2 envProbeOffsetCount;
        // ivec2 irrVolOffsetCount;

        int start;
        int lightCount;
        int decalCount;
        int envProbeIrrVolCount;        // packed, 高16位是 envProbe 数量，低 16 位是 irrvol 数量
    };
    layout (std140) uniform Clusters
    {
        Cluster clusters[NUM_CLUSTERS_PERVIEW];
    } u_clusters;
`;
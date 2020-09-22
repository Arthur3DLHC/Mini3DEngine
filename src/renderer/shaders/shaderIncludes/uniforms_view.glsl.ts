/**
 * todo: define uniform buffer layout
 */
export default /** glsl */`
    #define MAX_ITEM_VEC4S_PERVIEW  1024 // (4096 / 4) ivec4s
    #define NUM_CLUSTERS_PERVIEW    1536 //(16 * 8 * 12)

    layout (std140, column_major) uniform; 

    uniform View
    {
        mat4 matView;
        mat4 matProj;
        mat4 matInvView;
        mat4 matInvProj;
        mat4 matViewProjPrev;
        vec4 viewport;          // x, y, width, height
        vec3 position;
        float time;             // perframe buffer is too small, so put in there               
        vec2 zRange;            // near, far
        vec2 rtSize;            // render target full size, in pixels
        vec4 farRect;           // far plane left, bottom, right, top
        vec4 clusterRes;        // x, y, z resolusion of clusters.
        // fix me: 是否加一个亮度系数？
    } u_view;

    uniform ItemIndices
    {
        // fix me: 由于对齐，每个 int 元素会占一个ivec4
        // 所以不如直接用 ivec4，然后在 shader 中处理取分量的逻辑
        uvec4 indices[MAX_ITEM_VEC4S_PERVIEW]; // 一个int数组，其中按每个cluster顺序保存了其中所有光源索引，decal索引，envProbe索引，irradiance volume索引
    } u_itemIndices;


    struct Cluster {

        // fix me: 按照这个尺寸，会超过 OpenGL 保证的 16384 个 byte 的限制
        // 但是一般的DX11显卡应该都能保证 65536 个 byte
        // 注意对齐为四维向量
        uint start;
        uint lightCount;
        uint decalCount;
        uint envProbeCount;         // 高 16 位是环境反射探针数量，低 16 位是漫反射探针索引
    };
    uniform Clusters
    {
        Cluster clusters[NUM_CLUSTERS_PERVIEW];
    } u_clusters;
`;
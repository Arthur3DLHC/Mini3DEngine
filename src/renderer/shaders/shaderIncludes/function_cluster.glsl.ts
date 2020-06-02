/**
 * cluster relative functions
 */
export default /** glsl */`
    // todo: get cluster index from pixel H position
    uint clusterOfPixel(vec4 hPosition) {
        // need to divide by w?
        // todo: use u_view.clusterRes
        return 0u;
    }

    // 从 item 索引数组中取第 iidx 个索引
    uint getItemIndexAt(uint iidx) {
        // 由于 u_itemIndices.indices 是一个 uvec4 数组 （为了uniform对齐和不浪费字节）
        // 这里需要把传进来的 int 数组索引转为 uvec4 向量索引和分量索引;
        uint vecIdx = iidx / 4u;
        uint comp = iidx - vecIdx * 4u;
        return u_itemIndices.indices[vecIdx][comp];
    }
`;
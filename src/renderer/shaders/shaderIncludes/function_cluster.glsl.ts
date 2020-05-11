/**
 * cluster relative functions
 */
export default /** glsl */`
    // todo: get cluster index from pixel H position
    int clusterOfPixel(vec4 hPosition) {
        // need to divide by w?
        return 0;
    }

    // 从 item 索引数组中取第 iidx 个索引
    int getItemIndexAt(int iidx) {
        // 由于 u_itemIndices.indices 是一个 ivec4 数组 （为了uniform对齐和不浪费字节）
        // 这里需要把传进来的 int 数组索引转为 ivec4 向量索引和分量索引
        int vecIdx = iidx / 4;
        int comp = iidx - vecIdx * 4;
        return u_itemIndices.indices[vecIdx][comp];
    }
`;
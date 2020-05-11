/**
 * cluster relative functions
 */
export default /** glsl */`
    // todo: get cluster index from pixel H position
    int clusterOfPixel(vec4 hPosition) {
        // need to divide by w?
        return 0;
    }

    int getItemIndex(int iidx) {
        int vecIdx = iidx / 4;
        int comp = iidx - vecIdx * 4;
        // 从对象索引列表中获得光源索引
        return u_itemIndices.indices[vecIdx][comp];
    }
`;
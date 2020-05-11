/**
 * common lighting function
 */
export default /** glsl */`
    // get light from uniform buffer block
    // 获得指定cluster的光源列表在本视总体对象索引列表中的起始偏移和数量
    void getLightIndicesInCluster(int cluster, out int offset, out int count)
    {
        offset = u_clusters.clusters[cluster].start;
        count = u_clusters.clusters[cluster].lightCount;
    }

    int getLightCountInCluster(int cluster)
    {
        return u_clusters.clusters[cluster].lightCount;
    }

    Light getLightInCluster(int cluster, int iLight)
    {
        // 获得cluster中的光源索引列表在对象索引数组的起始偏移
        int offset = u_clusters.clusters[cluster].start + iLight;
        // 从对象索引列表中获得光源索引
        int lightIdx = getItemIndexAt(offset);
        return u_lights.lights[lightIdx];
    }
`;
/**
 * common lighting function
 */
export default /** glsl */`
    // get light from uniform buffer block
    // 获得指定cluster的光源列表在本视总体对象索引列表中的起始偏移和数量
    void getLightIndicesInCluster(uint cluster, out uint offset, out uint count)
    {
        offset = u_clusters.clusters[cluster].start;
        count = u_clusters.clusters[cluster].lightCount;
    }

    uint getLightCountInCluster(uint cluster)
    {
        return u_clusters.clusters[cluster].lightCount;
    }

    Light getLightInCluster(uint cluster, uint iLight)
    {
        // 获得cluster中的光源索引列表在对象索引数组的起始偏移
        uint offset = u_clusters.clusters[cluster].start + iLight;
        // 从对象索引列表中获得光源索引
        uint lightIdx = getItemIndexAt(offset);
        return u_lights.lights[lightIdx];
    }
`;
/**
 * get items of various types in cluster
 */
export default /** glsl */`
    //---------- lights -----------

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

    //---------- environment probes -----------

    void getEnvProbeIndicesInCluster(uint cluster, out uint offset, out uint count)
    {
        offset = u_clusters.clusters[cluster].start + u_clusters.clusters[cluster].lightCount + u_clusters.clusters[cluster].decalCount;
        count = u_clusters.clusters[cluster].envProbeIrrVolCount;
    }

    uint getEnvProbeCountInCluster(uint cluster)
    {
        return u_clusters.clusters[cluster].envProbeIrrVolCount;
    }

    EnvProbe getEnvProbeInCluster(uint cluster, uint iProbe)
    {
        // 每次都算有点浪费性能
        uint offset = u_clusters.clusters[cluster].start + u_clusters.clusters[cluster].lightCount + u_clusters.clusters[cluster].decalCount + iProbe;
        uint probeIdx = getItemIndexAt(offset);
        return u_envProbes.probes[probeIdx];
    }
`;
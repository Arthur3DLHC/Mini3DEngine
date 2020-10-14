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

    /*
    Light getLightInCluster(uint cluster, uint iLight)
    {
        // 获得cluster中的光源索引列表在对象索引数组的起始偏移
        uint offset = u_clusters.clusters[cluster].start + iLight;
        // 从对象索引列表中获得光源索引
        uint lightIdx = getItemIndexAt(offset);
        return u_lights.lights[lightIdx];
    }
    */

    //---------- environment (reflection) probes -----------

    uint getEnvProbeCountInCluster(uint cluster)
    {
        return u_clusters.clusters[cluster].envProbeCount / 65536u;
    }

    void getEnvProbeIndicesInCluster(uint cluster, out uint offset, out uint count)
    {
        offset = u_clusters.clusters[cluster].start + u_clusters.clusters[cluster].lightCount + u_clusters.clusters[cluster].decalCount;
        count = getEnvProbeCountInCluster(cluster);
    }

    /*
    // 目前没有用到
    EnvProbe getEnvProbeInCluster(uint cluster, uint iProbe)
    {
        // 每次都算有点浪费性能
        uint offset = u_clusters.clusters[cluster].start + u_clusters.clusters[cluster].lightCount + u_clusters.clusters[cluster].decalCount + iProbe;
        uint probeIdx = getItemIndexAt(offset);
        return u_envProbes.probes[probeIdx];
    }
    */

    //---------- irradiance probes ----------
    void getIrrProbeIndicesInCluster(uint cluster, out uint offset, out uint count)
    {
        uint reflProbeCount = getEnvProbeCountInCluster(cluster);
        offset = u_clusters.clusters[cluster].start + u_clusters.clusters[cluster].lightCount
         + u_clusters.clusters[cluster].decalCount + reflProbeCount;
        // count = u_clusters.clusters[cluster].envProbeCount - reflProbeCount * 65536u;
        count = u_clusters.clusters[cluster].envProbeCount % 65536u;
    }

    /*
    // 这两个函数没有用到
    uint getIrrProbeCountInCluster(uint cluster)
    {
        return u_clusters.clusters[cluster].envProbeCount - getEnvProbeCountInCluster(cluster) * 65536u;
    }

    IrradianceProbe getIrrProbeInCluster(uint cluster, uint iProbe)
    {
        // 每次都算有点浪费性能
        uint offset = u_clusters.clusters[cluster].start + u_clusters.clusters[cluster].lightCount + u_clusters.clusters[cluster].decalCount
         + getEnvProbeCountInCluster(cluster) + iProbe;
        uint probeIdx = getItemIndexAt(offset);
        return u_irrProbes.probes[probeIdx];
    }
    */
`;
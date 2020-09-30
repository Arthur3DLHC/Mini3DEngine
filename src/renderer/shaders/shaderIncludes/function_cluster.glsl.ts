/**
 * cluster relative functions
 */
export default /** glsl */`
    uint clusterOfPixel(vec4 hPosition) {
        // http://www.aortiz.me/2018/12/21/CG.html, solving slice from DOOM like equation

        // clusterParams are calculated as:
            // const numSlices = ClusteredForwardRenderContext.NUM_CLUSTERS_Z;
            // const logFarOverNear = Math.log(camera.far/camera.near)
            // clusterParams.z = numSlices / logFarOverNear;
            // clusterParams.w = - numSlices * Math.log(camera.near) / logFarOverNear;

        float viewZ = abs(hPosition.w);
        uint slice = uint(floor(log(viewZ) * u_view.clusterParams.z + u_view.clusterParams.w));

        // todo: calculate x and y
        vec4 ndc = hPosition / hPosition.w;

        uvec2 xy = uvec2(floor((ndc.xy * 0.5 + vec2(0.5)) * u_view.clusterParams.xy));
        uvec2 colRows = uvec2(u_view.clusterParams.xy);

        return slice * colRows.x * colRows.y + xy.y * colRows.x + xy.x;
        // return 0u;
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
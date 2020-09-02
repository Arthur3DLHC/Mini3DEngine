import { Frustum } from "../math/frustum.js";
import vec4 from "../../lib/tsm/vec4.js";
import { BoundingBox } from "../math/boundingBox.js";
import { Cluster } from "./cluster.js";

export class ClusterGrid {
    public near: number = 0.1;
    public far: number = 100;
    public left: number = -0.1;
    public right: number = 0.1;
    public bottom: number = -0.1;
    public top: number = 0.1;
    public resolusion: vec4 = new vec4([1,1,1,1]);

    // todo: save clusters hierarchical?
    public clusters: Cluster[][][] = [];

    /**
     * call this once the resolusion or frustum changed.
     */
    public updateClusters() {
        this.resolusion.x = Math.max(1, this.resolusion.x);
        this.resolusion.y = Math.max(1, this.resolusion.y);
        this.resolusion.z = Math.max(1, this.resolusion.z);

        this.clusters = [];

        // generate clusters
        for (let k = 0; k < this.resolusion.z; k++) {
            const layer: Cluster[][] = [];
            for (let j = 0; j < this.resolusion.y; j++) {
                const row: Cluster[] = [];
                for (let i = 0; i < this.resolusion.x; i++) {
                    const cluster: Cluster = new Cluster();
                    // todo: calc aabb
                    row.push(cluster);
                }
                layer.push(row);
            }
            this.clusters.push(layer);
        }
    }

    /**
     * call this per frame
     */
    public clearItems() {
        for (let k = 0; k < this.resolusion.z; k++) {
            for (let j = 0; j < this.resolusion.y; j++) {
                for (let i = 0; i < this.resolusion.x; i++) {
                    const cluster: Cluster = this.clusters[k][j][i];
                    cluster.clear();
                }
            }
        }
    }

    /**
     * get the cluster aabb in view space
     * @param i 
     * @param j 
     * @param k 
     * @param result 
     */
    public getClusterBounding(i: number, j: number, k: number, result: BoundingBox) {
    }

    // todo: check items
    // hierarchical:
    // for every item,
    //  check agains the view frustm;
    //  if intersect,
    //      for every depth slice,
    //          check item against it's aabb
    //          if intersect,
    //              for every row,
    //                  check item against it's aabb
    //                  if intersect,
    //                      for every cluster,
    //                          check item against it's aabb
    //                              if intersect
    //                                  fill item to cluster's list
}
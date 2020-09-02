import { Frustum } from "../math/frustum.js";
import vec4 from "../../lib/tsm/vec4.js";
import { BoundingBox } from "../math/boundingBox.js";
import { Cluster } from "./cluster.js";
import { BaseLight } from "../scene/lights/baseLight.js";
import { Decal } from "../scene/decal.js";
import { EnvironmentProbe } from "../scene/environmentProbe.js";
import mat4 from "../../lib/tsm/mat4.js";
import vec3 from "../../lib/tsm/vec3.js";

/**
 * See http://www.aortiz.me/2018/12/21/CG.html
 */
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

    private frustum: Frustum = new Frustum();

    /**
     * call this only when the resolusion or frustum changed.
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
                    const cluster: Cluster = new Cluster(i, j, k);
                    this.getClusterAABB(i, j, k, cluster.boudingBox);
                    row.push(cluster);
                }
                layer.push(row);
            }
            this.clusters.push(layer);
        }

        // update frustum
        const matProj: mat4 = mat4.frustum(this.left, this.right, this.bottom, this.top, this.near, this.far);
        this.frustum.setFromProjectionMatrix(matProj, false);
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

    public fillLight(light: BaseLight) {
        // need to transform to view space

        // point light: bounding sphere

        // spot light: bounding frustum? 6 planes

        // directional light: bounding box? 6 planes
    }

    public fillDecal(decal: Decal) {
        // need to transform to view space
        // bounding box
    }

    public fillEnvironmentProbe(envProbe: EnvironmentProbe) {
        // need to transform to view space
        // bounding box
    }

    /**
     * get the cluster aabb in view space
     * @param i 
     * @param j 
     * @param k 
     * @param result 
     */
    protected getClusterAABB(i: number, j: number, k: number, result: BoundingBox) {

    }

    protected getSlickAABB(k: number, result: BoundingBox) {

    }

    protected getRowAABB(j: number, k: number, result: BoundingBox) {

    }

    protected getGridPoint(i: number, j: number, k: number, result: vec3) {
        // from DOOM 2016 presentation
        // See http://www.aortiz.me/2018/12/21/CG.html for the formula to get the cluster slice from pixel depth in shader
        // github repo: https://github.com/Angelo1211/HybridRenderingEngine/
        const e = k / this.resolusion.z;
        result.z = this.near * Math.pow((this.far / this.near), e);
    }
}
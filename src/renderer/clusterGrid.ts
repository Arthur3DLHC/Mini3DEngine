import { Frustum } from "../math/frustum.js";
import vec4 from "../../lib/tsm/vec4.js";
import { BoundingBox } from "../math/boundingBox.js";
import { Cluster } from "./cluster.js";
import { BaseLight } from "../scene/lights/baseLight.js";
import { Decal } from "../scene/decal.js";
import { EnvironmentProbe } from "../scene/environmentProbe.js";
import mat4 from "../../lib/tsm/mat4.js";
import vec3 from "../../lib/tsm/vec3.js";
import { BoundingSphere } from "../math/boundingSphere.js";
import { PointLight } from "../scene/lights/pointLight.js";
import { SpotLight } from "../scene/lights/spotLight.js";

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

    public viewTransform: mat4 = new mat4();

    // todo: save clusters hierarchical?
    public clusters: Cluster[][][] = [];

    private _frustum: Frustum = new Frustum();

    private _tmpMinPointNear: vec3 = new vec3();
    private _tmpMaxPointNear: vec3 = new vec3();
    private _tmpMinPointFar: vec3 = new vec3();
    private _tmpMaxPointFar: vec3 = new vec3();

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
        this._frustum.setFromProjectionMatrix(matProj, false);
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
    //  check item boundingSphere agains the view frustm;
    //  if intersect,
    //      for every depth slice,
    //          check item (boundingSphere or 6 planes) against it's aabb
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
        const boundingSphere = new BoundingSphere(light.boundingSphere.center, light.boundingSphere.radius);
        const matModelView = new mat4();
        mat4.product(this.viewTransform, light.worldTransform, matModelView);
        boundingSphere.transform(matModelView);

        if (!this._frustum.intersectsSphere(boundingSphere)) {
            return;
        }

        const boundingBox: BoundingBox = new BoundingBox();

        // iterate clusters hierarchically
        if (light instanceof PointLight) {
            // slices
            for (let k = 0; k < this.resolusion.z; k++) {
                this.getSliceAABB(k, boundingBox);
    
                if (boundingBox.intersectSphere(boundingSphere)) {
                    // rows
                    for (let j = 0; j < this.resolusion.y; j++) {
                        this.getRowAABB(j, k, boundingBox);
                        if (boundingBox.intersectSphere(boundingSphere)) {
                            // clusters
                            
                        }
                    }
                }
            }            
        } else if (light instanceof SpotLight) {

        } else {
            // fix me: directional light range is infinite.
        }

        // point light: bounding sphere vs AABB

        // planes and AABB culling:
        // https://www.braynzarsoft.net/viewtutorial/q16390-34-aabb-cpu-side-frustum-culling

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
        this.getGridPoint(i, j, k + 1, this._tmpMinPointFar);
        this.getGridPoint(i + 1, j + 1, k + 1, this._tmpMaxPointFar);
        this.calcAABBByFarCorners(k, this._tmpMinPointFar, this._tmpMaxPointFar, result);
    }

    protected getSliceAABB(k: number, result: BoundingBox) {
        // min point: left bottom grid
        this.getGridPoint(0, 0, k + 1, this._tmpMinPointFar);
        this.getGridPoint(this.resolusion.x, this.resolusion.y, k + 1, this._tmpMaxPointFar);
        this.calcAABBByFarCorners(k, this._tmpMinPointFar, this._tmpMaxPointFar, result);
    }

    protected getRowAABB(j: number, k: number, result: BoundingBox) {
        this.getGridPoint(0, j, k + 1, this._tmpMinPointFar);
        this.getGridPoint(this.resolusion.x, j + 1, k + 1, this._tmpMaxPointFar);
        this.calcAABBByFarCorners(k, this._tmpMinPointFar, this._tmpMaxPointFar, result);
    }
    
    private calcAABBByFarCorners(k: number, minPtFar: vec3, maxPtFar: vec3, result: BoundingBox) {
        const sliceNearZ = this.getSliceZ(k);
        const scale = sliceNearZ / minPtFar.z;

        this._tmpMinPointNear.z = sliceNearZ;
        this._tmpMinPointNear.x = minPtFar.x * scale;
        this._tmpMinPointNear.y = minPtFar.y * scale;

        this._tmpMaxPointNear.z = sliceNearZ;
        this._tmpMaxPointNear.x = maxPtFar.x * scale;
        this._tmpMaxPointNear.y = maxPtFar.y * scale;

        // note the z is negative, so the far the smaller, the near the bigger
        result.minPoint.z = minPtFar.z;
        result.minPoint.x = Math.min(minPtFar.x, this._tmpMinPointNear.x);
        result.minPoint.y = Math.min(minPtFar.y, this._tmpMinPointNear.y);

        result.maxPoint.z = this._tmpMinPointNear.z;
        result.maxPoint.x = Math.max(maxPtFar.x, this._tmpMaxPointNear.x);
        result.maxPoint.y = Math.max(maxPtFar.y, this._tmpMaxPointNear.y);
    }

    protected getSliceZ(slice: number): number {
       // from DOOM 2016 presentation
        // See http://www.aortiz.me/2018/12/21/CG.html for the formula to get the cluster slice from pixel depth in shader
        // github repo: https://github.com/Angelo1211/HybridRenderingEngine/
        const e = slice / this.resolusion.z;
        return -this.near * Math.pow((this.far / this.near), e);    // negative z in view space
    }

    protected getGridPoint(i: number, j: number, k: number, result: vec3) {
        result.z = this.getSliceZ(k);

        const scale = result.z / this.near;
        // x
        const xNear = this.left + (i / this.resolusion.x) * (this.right - this.left);
        result.x = scale * xNear;

        // y
        const yNear = this.bottom + (j / this.resolusion.y) * (this.top - this.bottom);
        result.y = scale * yNear;
    }
}
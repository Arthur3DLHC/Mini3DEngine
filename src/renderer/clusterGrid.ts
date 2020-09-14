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
import { DirectionalLight } from "../scene/lights/directionalLight.js";
import { DirectionalLightShadow } from "../scene/lights/directionalLightShadow.js";

/**
 * See http://www.aortiz.me/2018/12/21/CG.html
 */
export class ClusterGrid {
    public get near(): number {return this._near;}
    public get far(): number {return this._far;}
    public get left(): number {return this.left;}
    public get right(): number {return this.right;}
    public get bottom(): number {return this.bottom;}
    public get top(): number {return this.top;}
    public get orthographic(): boolean {return this.orthographic;}        // orthographic or perspective
    public get resolusion(): vec3 {return this._resolusion;}

    public viewTransform: mat4 = new mat4();

    // todo: save clusters hierarchical?
    public clusters: Cluster[][][] = [];

    // private _aabbDirty = false;
    // private _clusterdDirty = false;
    private _frustum: Frustum = new Frustum();

    private _near: number = 0.1;
    private _far: number = 100;
    private _left: number = -0.1;
    private _right: number = 0.1;
    private _bottom: number = -0.1;
    private _top: number = 0.1;
    private _orthographic: boolean = false;        // orthographic or perspective
    private _resolusion: vec3 = new vec3([1,1,1]);

    private _tmpMinPointNear: vec3 = new vec3();
    private _tmpMaxPointNear: vec3 = new vec3();
    private _tmpMinPointFar: vec3 = new vec3();
    private _tmpMaxPointFar: vec3 = new vec3();

    private _tmpInvViewTransform: mat4 = new mat4();

    /**
     * call this only when the resolusion or frustum changed.
     */
    public initialize() {
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
                    // this.getClusterAABB(i, j, k, cluster.boudingBox);
                    row.push(cluster);
                }
                layer.push(row);
            }
            this.clusters.push(layer);
        }
    }

    public setFrustumParams(l: number, r: number, b: number, t: number, n: number, f: number) {
        let dirty = false;
        if(this._left !== l) {this._left = l; dirty = true;}
        if(this._right !== r) {this._right = r; dirty = true;}
        if(this._bottom !== b) {this._bottom = b; dirty = true;}
        if(this._top !== t) {this._top = t; dirty = true;}
        if(this._near !== n) {this._near = n; dirty = true;}
        if(this._far !== f) {this._far = f; dirty = true;}
        if (dirty) {
            this.updateClusterAABBs();
        }
    }

    public updateClusterAABBs() {
        for (let k = 0; k < this.resolusion.z; k++) {
            for (let j = 0; j < this.resolusion.y; j++) {
                for (let i = 0; i < this.resolusion.x; i++) {
                    const cluster: Cluster = this.clusters[k][j][i];
                    this.getClusterAABB(i, j, k, cluster.boudingBox);
                }
            }
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


    public fillLight(light: BaseLight, lightIdx: number) {
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
            // point light: bounding sphere vs AABB
            this.checkClustersWithBoundingSphere(boundingSphere, (cluster: Cluster)=>{
                cluster.lights.push(lightIdx);
            });
            /*
            // slices
            for (let k = 0; k < this.resolusion.z; k++) {
                this.getSliceAABB(k, boundingBox);
    
                if (boundingBox.intersectSphere(boundingSphere)) {
                    // rows
                    for (let j = 0; j < this.resolusion.y; j++) {
                        this.getRowAABB(j, k, boundingBox);
                        if (boundingBox.intersectSphere(boundingSphere)) {
                            // clusters
                            for (let i = 0; i < this.resolusion.x; i++) {
                                this.getClusterAABB(i, j, k, boundingBox);
                                if (boundingBox.intersectSphere(boundingSphere)) {
                                    this.clusters[k][j][i].lights.push(lightIdx);
                                }
                            }
                        }
                    }
                }
            }
            */
        } else if (light instanceof SpotLight) {
            // spot light: bounding frustum? 6 planes vs AABB
            // planes and AABB culling:
            // https://www.braynzarsoft.net/viewtutorial/q16390-34-aabb-cpu-side-frustum-culling
            const spotLight = light as SpotLight;

            // todo: optimize - too much temp newed matrices
            // the viewproj transform of spotLight
            const matLightView = spotLight.worldTransform.copy();
            matLightView.inverse();
            const matLightProj = mat4.perspective(Math.min(spotLight.outerConeAngle * 2, 3.10) * 180.0 / Math.PI, 1, 0.01, spotLight.range > 0 ? spotLight.range : 100);

            const matLightViewProj = new mat4();
            mat4.product(matLightProj, matLightView, matLightViewProj);

            // from view space to light proj space
            const matInvView = this.viewTransform.copy(this._tmpInvViewTransform);
            matInvView.inverse();

            const matFrustum = new mat4();
            mat4.product(matLightViewProj, matInvView, matFrustum);

            // light frustum in view space
            // fix me: can the frustum be cached on light object?
            const lightFrustum = new Frustum();
            lightFrustum.setFromProjectionMatrix(matFrustum);
            // test frustum and aabb
            this.checkClustersWithFrustum(lightFrustum, (cluster: Cluster)=>{
                cluster.lights.push(lightIdx);
            });
            /*
            // slices
            for (let k = 0; k < this.resolusion.z; k++) {
                this.getSliceAABB(k, boundingBox);
    
                if (lightFrustum.intersectsBox(boundingBox)) {
                    // rows
                    for (let j = 0; j < this.resolusion.y; j++) {
                        this.getRowAABB(j, k, boundingBox);
                        if (lightFrustum.intersectsBox(boundingBox)) {
                            // clusters
                            for (let i = 0; i < this.resolusion.x; i++) {
                                this.getClusterAABB(i, j, k, boundingBox);
                                if (lightFrustum.intersectsBox(boundingBox)) {
                                    this.clusters[k][j][i].lights.push(lightIdx);
                                }
                            }
                        }
                    }
                }
            }
            */
        } else {
            const dirLight = light as DirectionalLight;
            if (dirLight.radius === 0) {    // infinite radius
                for (let k = 0; k < this.resolusion.z; k++) {
                    for (let j = 0; j < this.resolusion.y; j++) {
                        for (let i = 0; i < this.resolusion.x; i++) {
                            this.clusters[k][j][i].lights.push(lightIdx);
                        }
                    }
                }
            } else {
                // todo: check light frustum
                // todo: optimize - too much temp newed matrices
                // the viewproj transform of spotLight
                const shadow = dirLight.shadow as DirectionalLightShadow;

                const matLightView = dirLight.worldTransform.copy();
                matLightView.inverse();
                //const matLightProj = mat4.perspective(Math.min(spotLight.outerConeAngle * 2, 3.10) * 180.0 / Math.PI, 1, 0.01, spotLight.range > 0 ? spotLight.range : 100);
                const matLightProj = mat4.orthographic(-dirLight.radius, dirLight.radius, -dirLight.radius, dirLight.radius, 0.01, shadow.distance);

                const matLightViewProj = new mat4();
                mat4.product(matLightProj, matLightView, matLightViewProj);

                // from view space to light proj space
                const matInvView = this.viewTransform.copy(this._tmpInvViewTransform);
                matInvView.inverse();

                const matFrustum = new mat4();
                mat4.product(matLightViewProj, matInvView, matFrustum);

                // light frustum in view space
                // fix me: can the frustum be cached on light object?
                const lightFrustum = new Frustum();
                lightFrustum.setFromProjectionMatrix(matFrustum);
                // test frustum and aabb
                this.checkClustersWithFrustum(lightFrustum, (cluster: Cluster) => {
                    cluster.lights.push(lightIdx);
                });
            }
        }
    }

    public fillDecal(decal: Decal) {
        // need to transform to view space
        // limit visible distance

        // check against cluster aabbs
        // bounding box? 6 planes?
    }

    public fillEnvironmentProbe(envProbe: EnvironmentProbe, idx: number) {
        // need to transform to view space
        // bounding sphere?
        const boundingSphere = new BoundingSphere(vec3.zero, 1);
        const matModelView = new mat4();
        mat4.product(this.viewTransform, envProbe.worldTransform, matModelView);
        boundingSphere.transform(matModelView);

        if (!this._frustum.intersectsSphere(boundingSphere)) {
            return;
        }

        // todo: environment probes visible distance limit

        this.checkClustersWithBoundingSphere(boundingSphere, (cluster: Cluster)=>{
            cluster.envProbes.push(idx);
        });
    }

    /**
     * hierarchical test cluster aabbs with bounding sphere
     * @param boundingSphere 
     * @param onIntersect callback function when cluster aabb intersects bounding sphere
     */
    protected checkClustersWithBoundingSphere(boundingSphere: BoundingSphere, onIntersect:(cluster: Cluster)=>void) {
        // for early quit loop
        let intersectLastSlice: boolean = false;
        let intersectLastRow: boolean = false;
        let intersectLastCluster: boolean = false;
        const boundingBox: BoundingBox = new BoundingBox();

        // slices
        for (let k = 0; k < this.resolusion.z; k++) {
            this.getSliceAABB(k, boundingBox);
            let intersectThisSlice = boundingBox.intersectSphere(boundingSphere);
            if (intersectThisSlice) {
                // rows
                intersectLastRow = false;
                for (let j = 0; j < this.resolusion.y; j++) {
                    this.getRowAABB(j, k, boundingBox);
                    let intersectThisRow = boundingBox.intersectSphere(boundingSphere);
                    if (intersectThisRow) {
                        // clusters
                        intersectLastCluster = false;
                        for (let i = 0; i < this.resolusion.x; i++) {
                            this.getClusterAABB(i, j, k, boundingBox);
                            let intersectThisCluster = boundingBox.intersectSphere(boundingSphere);
                            if (intersectThisCluster) {
                                // this.clusters[k][j][i].envProbes.push(idx);
                                onIntersect(this.clusters[k][j][i]);
                            } else {
                                if (intersectLastCluster) {
                                    break;
                                }
                            }
                            intersectLastCluster = intersectThisCluster;
                        }
                    } else {
                        if (intersectLastRow) {
                            break;
                        }
                    }
                    intersectLastRow = intersectThisRow;
                }
            } else {
                if (intersectLastSlice) {
                    break;
                }
            }
            intersectLastSlice = intersectThisSlice;
        }
    }

    protected checkClustersWithFrustum(frustum: Frustum, onIntersect:(cluster: Cluster)=>void) {
        
        let intersectLastSlice: boolean = false;
        let intersectLastRow: boolean = false;
        let intersectLastCluster: boolean = false;
        
        const boundingBox: BoundingBox = new BoundingBox();
        
        // slices
        for (let k = 0; k < this.resolusion.z; k++) {
            this.getSliceAABB(k, boundingBox);
            let intersectThisSlice = frustum.intersectsBox(boundingBox);
            if (intersectThisSlice) {
                // rows
                intersectLastRow = false;
                for (let j = 0; j < this.resolusion.y; j++) {
                    this.getRowAABB(j, k, boundingBox);
                    let intersectThisRow = frustum.intersectsBox(boundingBox);
                    if (intersectThisRow) {
                        // clusters
                        intersectLastCluster = false;
                        for (let i = 0; i < this.resolusion.x; i++) {
                            this.getClusterAABB(i, j, k, boundingBox);
                            let intersectThisCluster = frustum.intersectsBox(boundingBox);
                            if (intersectThisCluster) {
                                onIntersect(this.clusters[k][j][i]);
                            } else {
                                if (intersectLastCluster) break;
                            }
                            intersectLastCluster = intersectThisCluster;
                        }
                    } else {
                        if (intersectLastRow) break;
                    }
                    intersectLastRow = intersectThisRow;
                }
            } else {
                if (intersectLastSlice) break;
            }
            intersectLastSlice = intersectThisSlice;
        }
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
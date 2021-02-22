import { RenderContext } from "./renderContext.js";
import { BufferHelper } from "../utils/bufferHelper.js";
import { UniformBuffer } from "../WebGLResources/uniformBuffer.js";
import { Decal } from "../scene/decal.js";
import { BaseLight } from "../scene/lights/baseLight.js";
import { LightType } from "../scene/lights/lightType.js";
import { PointLight } from "../scene/lights/pointLight.js";
import { SpotLight } from "../scene/lights/spotLight.js";
import { Camera } from "../scene/cameras/camera.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { Texture2D } from "../WebGLResources/textures/texture2D.js";
import { RenderItem } from "./renderItem.js";
import { Material } from "../scene/materials/material.js";
import { GLUniformBuffers } from "../WebGLResources/glUnifomBuffers.js";
import { ShaderProgram } from "../WebGLResources/shaderProgram.js";
import { StandardPBRMaterial } from "../scene/materials/standardPBRMaterial.js";
import mat4 from "../../lib/tsm/mat4.js";
import vec4 from "../../lib/tsm/vec4.js";
import vec3 from "../../lib/tsm/vec3.js";
import vec2 from "../../lib/tsm/vec2.js";
import { Clock } from "../scene/clock.js";
import { TextureCube } from "../WebGLResources/textures/textureCube.js";
import { Halton } from "../math/halton.js";
import { Hammersley } from "../math/Hammersley.js";
import { SkinMesh } from "../scene/skinMesh.js";
import { InstancedMesh } from "../scene/instancedMesh.js";
import { ClusterGrid } from "./clusterGrid.js";
import { PerspectiveCamera } from "../scene/cameras/perspectiveCamera.js";
import { DirectionalLight } from "../scene/lights/directionalLight.js";

export class ClusteredForwardRenderContext extends RenderContext {
    public constructor() {
        super();

        this._clusterGrid = new ClusterGrid();
        // todo: where to initialize cluster grids?
        this._clusterGrid.resolusion.x = ClusteredForwardRenderContext.NUM_CLUSTERS_X;
        this._clusterGrid.resolusion.y = ClusteredForwardRenderContext.NUM_CLUSTERS_Y;
        this._clusterGrid.resolusion.z = ClusteredForwardRenderContext.NUM_CLUSTERS_Z;
        this._clusterGrid.initialize();

        this._tmpData = new Float32Array(4096);
        this._buffer = new BufferHelper(this._tmpData);

        this._tmpIdxData = new Uint32Array(ClusteredForwardRenderContext.MAX_ITEMS);
        this._idxBuffer = new BufferHelper(this._tmpIdxData);

        this._tmpClusterData = new Uint32Array(ClusteredForwardRenderContext.NUM_CLUSTERS * ClusteredForwardRenderContext.CLUSTER_SIZE_INT);
        this._clusterBuffer = new BufferHelper(this._tmpClusterData);

        this._tmpColor = new vec4();

        this._ubLights = new UniformBuffer("lights");
        this._ubDecals = new UniformBuffer("decals");
        this._ubEnvProbes = new UniformBuffer("envprobes");
        this._ubIrrProbes = new UniformBuffer("irrVolumes");
        this._ubDitherPattern = new UniformBuffer("ditherPattern");
        //this._ubFrame = new UniformBuffer();
        this._ubView = new UniformBuffer("view");
        this._ubItemIndices = new UniformBuffer("itemIndices");
        this._ubClusters = new UniformBuffer("clusters");
        this._ubObject = new UniformBuffer("object");
        this._ubMaterialPBR = new UniformBuffer("material");

        this.setUniformBufferLayouts();

        this._ubLights.build();
        this._ubDecals.build();
        this._ubEnvProbes.build();
        this._ubIrrProbes.build();
        this._ubDitherPattern.build();
        //this._ubFrame.build();
        this._ubView.build();
        this._ubItemIndices.build();
        this._ubClusters.build();
        this._ubObject.build();
        this._ubMaterialPBR.build();

        this.setUniformBlockBindingPoints();
        this.bindUniformBuffers();
    }

    private _clusterGrid: ClusterGrid;

    private _tmpData: Float32Array;
    private _buffer: BufferHelper;
    private _tmpIdxData: Uint32Array;
    private _idxBuffer: BufferHelper;
    private _tmpClusterData: Uint32Array;
    private _clusterBuffer: BufferHelper;
    private _tmpColor: vec4;

    // uniform buffers
    private _ubLights: UniformBuffer;
    private _ubDecals: UniformBuffer;
    private _ubEnvProbes: UniformBuffer;
    private _ubIrrProbes: UniformBuffer;
    private _ubDitherPattern: UniformBuffer;
    // private _ubFrame: UniformBuffer;
    private _ubView: UniformBuffer;
    private _ubItemIndices: UniformBuffer;
    private _ubClusters: UniformBuffer;
    private _ubObject: UniformBuffer;
    private _ubMaterialPBR: UniformBuffer;


    public get ubMaterialPBR(): UniformBuffer {
        return this._ubMaterialPBR;
    }
    
    public static readonly LIGHT_SIZE_FLOAT = 40;
    public static readonly DECAL_SIZE_FLOAT = 20;
    public static readonly ENVPROBE_SIZE_FLOAT = 8;
    public static readonly IRRPROBE_SIZE_FLOAT = 4;

    public static readonly NUM_CLUSTERS_X = 8;      // 16
    public static readonly NUM_CLUSTERS_Y = 4;      // 8
    public static readonly NUM_CLUSTERS_Z = 12;     // 24
    public static readonly NUM_CLUSTERS = ClusteredForwardRenderContext.NUM_CLUSTERS_X * ClusteredForwardRenderContext.NUM_CLUSTERS_Y * ClusteredForwardRenderContext.NUM_CLUSTERS_Z;
    public static readonly CLUSTER_SIZE_INT = 4;

    public static readonly MAX_LIGHTS = 256;
    public static readonly MAX_DECALS = 512;
    public static readonly MAX_ENVPROBES = 128;
    public static readonly MAX_IRRPROBES = 512;
    public static readonly MAX_ITEMS = 8192;
    public static readonly MAX_BONES = 256;

    /**
     * cube texture face size for reflection and irradiance probes
     */
    public envmapSize: number = 64;

    private setUniformBufferLayouts() {

        // per scene

        // TODO: 带结构和数组的 uniform buffer 怎么初始化和更新值？
        // 数组长度 * 对齐后的结构浮点数个数
        const matIdentity = mat4.identity;
        this._ubLights.addUniform("lights", ClusteredForwardRenderContext.MAX_LIGHTS * ClusteredForwardRenderContext.LIGHT_SIZE_FLOAT);
        this._ubDecals.addUniform("decals", ClusteredForwardRenderContext.MAX_DECALS * ClusteredForwardRenderContext.DECAL_SIZE_FLOAT);
        this._ubEnvProbes.addUniform("probes", ClusteredForwardRenderContext.MAX_ENVPROBES * ClusteredForwardRenderContext.ENVPROBE_SIZE_FLOAT);
        this._ubIrrProbes.addUniform("probes", ClusteredForwardRenderContext.MAX_IRRPROBES * ClusteredForwardRenderContext.IRRPROBE_SIZE_FLOAT);
        this._ubDitherPattern.addMat4("randX", matIdentity);
        this._ubDitherPattern.addMat4("randY", matIdentity);

        // per frame,
        // it's too small and webgl does not allow small uniform buffers,
        // so put the time into per view buffer
        //this._ubFrame.addFloat("time", 0);

        // per view,
        this._ubView.addMat4("matView", matIdentity);
        this._ubView.addMat4("matProj", matIdentity);
        this._ubView.addMat4("matInvView", matIdentity);
        this._ubView.addMat4("matInvProj", matIdentity);
        this._ubView.addMat4("matViewProjPrev", matIdentity);
        this._ubView.addVec4("viewport", new vec4());
        this._ubView.addVec3("position", new vec3());
        this._ubView.addFloat("time", 0);
        this._ubView.addVec2("zRange", new vec2());
        this._ubView.addVec2("rtSize", new vec2());
        this._ubView.addVec4("farRect", new vec4());
        this._ubView.addVec4("clusterParams", new vec4());

        this._ubItemIndices.addUniform("indices", ClusteredForwardRenderContext.MAX_ITEMS);

        this._ubClusters.addUniform("clusters", ClusteredForwardRenderContext.NUM_CLUSTERS * ClusteredForwardRenderContext.CLUSTER_SIZE_INT);

        // per obj
        this._ubObject.addMat4("matWorld", matIdentity);
        this._ubObject.addMat4("matWorldPrev", matIdentity);
        this._ubObject.addVec4("color", new vec4());
        this._ubObject.addVec4("props", new vec4());
        // this._ubObject.addFloat("tag", 0);
        this._ubObject.addUniform("matBones", ClusteredForwardRenderContext.MAX_BONES * 16);
        this._ubObject.addUniform("matPrevBones", ClusteredForwardRenderContext.MAX_BONES * 16);

        // per mtl
        // default pbr material
        this._ubMaterialPBR.addVec4("baseColor", new vec4());
        this._ubMaterialPBR.addVec4("emissive", new vec4());

        this._ubMaterialPBR.addVec3("subsurfaceColor", new vec3());
        this._ubMaterialPBR.addFloat("subsurface", 0);

        this._ubMaterialPBR.addFloat("subsurfaceRadius", 0);
        this._ubMaterialPBR.addFloat("subsurfacePower", 0);
        this._ubMaterialPBR.addFloat("subsurfaceThickness", 0);
        this._ubMaterialPBR.addFloat("specular", 0);

        this._ubMaterialPBR.addFloat("metallic", 0);
        this._ubMaterialPBR.addFloat("roughness", 0);
        this._ubMaterialPBR.addFloat("colorMapAmount", 0);
        this._ubMaterialPBR.addFloat("metallicMapAmount", 0);

        this._ubMaterialPBR.addFloat("roughnessMapAmount", 0);
        this._ubMaterialPBR.addFloat("normalMapAmount", 0);
        this._ubMaterialPBR.addFloat("occlusionMapAmount", 0);
        this._ubMaterialPBR.addFloat("emissiveMapAmount", 0);
    }
    
    private setUniformBlockBindingPoints() {
        GLUniformBuffers.uniformBlockNames["Lights"] = 0;
        GLUniformBuffers.uniformBlockNames["Decals"] = 1;
        GLUniformBuffers.uniformBlockNames["EnvProbes"] = 2;
        GLUniformBuffers.uniformBlockNames["IrrProbes"] = 3;
        GLUniformBuffers.uniformBlockNames["View"] = 4;
        GLUniformBuffers.uniformBlockNames["DitherPattern"] = 5;
        GLUniformBuffers.uniformBlockNames["ItemIndices"] = 6;
        GLUniformBuffers.uniformBlockNames["Clusters"] = 7;
        GLUniformBuffers.uniformBlockNames["Object"] = 8;
        GLUniformBuffers.uniformBlockNames["Material"] = 9;
        //GLUniformBuffers.uniformBlockNames["Frame"] = 10;
    }

    private bindUniformBuffers() {
        GLUniformBuffers.bindUniformBuffer(this._ubLights, "Lights");
        GLUniformBuffers.bindUniformBuffer(this._ubDecals, "Decals");
        GLUniformBuffers.bindUniformBuffer(this._ubEnvProbes, "EnvProbes");
        GLUniformBuffers.bindUniformBuffer(this._ubIrrProbes, "IrrProbes");
        GLUniformBuffers.bindUniformBuffer(this._ubDitherPattern, "DitherPattern");
        //GLUniformBuffers.bindUniformBuffer(this._ubFrame, "Frame");
        GLUniformBuffers.bindUniformBuffer(this._ubView, "View");
        GLUniformBuffers.bindUniformBuffer(this._ubItemIndices, "ItemIndices");
        GLUniformBuffers.bindUniformBuffer(this._ubClusters, "Clusters");
        GLUniformBuffers.bindUniformBuffer(this._ubObject, "Object");
        GLUniformBuffers.bindUniformBuffer(this._ubMaterialPBR, "Material");
    }

    public bindUniformBlocks(program: ShaderProgram) {
        GLUniformBuffers.bindUniformBlock(program, "Lights");
        GLUniformBuffers.bindUniformBlock(program, "Decals");
        GLUniformBuffers.bindUniformBlock(program, "EnvProbes");
        GLUniformBuffers.bindUniformBlock(program, "IrrProbes");
        GLUniformBuffers.bindUniformBlock(program, "DitherPattern");
        //GLUniformBuffers.bindUniformBlock(program, "Frame");
        GLUniformBuffers.bindUniformBlock(program, "View");
        GLUniformBuffers.bindUniformBlock(program, "ItemIndices");
        GLUniformBuffers.bindUniformBlock(program, "Clusters");
        GLUniformBuffers.bindUniformBlock(program, "Object");
        GLUniformBuffers.bindUniformBlock(program, "Material");
    }

    public fillUniformBuffersPerScene() {
        // todo: fill all static lights in scene
        // all static decals
        // all envprobes
        // all irradiance probes
        // pay attention to uniform alignment;

        this._buffer.seek(0);
        for (let i = 0; i < this.staticLightCount; i++) {
            const light = this.staticLights[i];
            this.addLightToBuffer(this._buffer, light);
        }
        this._ubLights.setUniform("lights", this._tmpData, this._buffer.length);
        this._ubLights.update();

        this._buffer.seek(0);
        for (let i = 0; i < this.staticDecalCount; i++) {
            const decal = this.staticDecals[i];
            this.addDecalToBuffer(this._buffer, decal);
        }
        this._ubDecals.setUniform("decals", this._tmpData, this._buffer.length);
        this._ubDecals.update();

        this._buffer.seek(0);
        for( let i = 0; i < this.envProbeCount; i++) {
            const probe = this.envProbes[i];
            let position = new vec3();
            probe.worldTransform.getTranslation(position);
            this._buffer.addArray(position.values);
            // todo: pass in size? no need for texture index, because it == probe index
            // the envprobe has unique scaling.
            this._buffer.addNumber(probe.radius);
            this._buffer.addNumber(probe.visibleDistance);
            this._buffer.addNumber(probe.visibleDistance);      // UBO alignment
            this._buffer.addNumber(probe.visibleDistance);      // UBO alignment
            this._buffer.addNumber(probe.visibleDistance);      // UBO alignment
        }
        this._ubEnvProbes.setUniform("probes", this._tmpData, this._buffer.length);
        this._ubEnvProbes.update();

        this._buffer.seek(0);
        for (let i = 0; i < this.irradianceProbeCount; i++) {
            const probe = this.irradianceProbes[i];
            let position = new vec3();
            probe.worldTransform.getTranslation(position);
            this._buffer.addArray(position.values);
            // todo: pass in size? no need for texture index, because it == probe index
            // the envprobe has unique scaling.
            this._buffer.addNumber(probe.radius);
        }
        this._ubIrrProbes.setUniform("probes", this._tmpData, this._buffer.length);
        this._ubIrrProbes.update();

        // dither pattern
        // todo: should use a texture ?
        const randX: mat4 = new mat4();
        const randY: mat4 = new mat4();

        // test raw random
        // should use blue noise ? or halton sequence?
        for(let i = 0; i < 4; i++) {
            for(let j = 0; j < 4; j++) {
                // plain randeom
                // randX.values[i * 4 + j] = Math.random();
                // randY.values[i * 4 + j] = Math.random();
            
                // halton
                // randX.values[i * 4 + j] = Halton.get(i * 4 + j, 2);
                // randY.values[i * 4 + j] = Halton.get(i * 4 + j, 3);

                // hammersley
                randX.values[i * 4 + j] = Hammersley.get(0, i * 4 + j, 2, 16);
                randY.values[i * 4 + j] = Hammersley.get(1, i * 4 + j, 3, 16);
            }
        }
        this._ubDitherPattern.setMat4("randX", randX);
        this._ubDitherPattern.setMat4("randY", randY);

        this._ubDitherPattern.update();
    }

    private addDecalToBuffer(buffer: BufferHelper, decal: Decal) {
        buffer.addArray(decal.worldTransform.values);
        buffer.addArray(decal.atlasRect.values);
    }

    private addLightToBuffer(buffer: BufferHelper, light: BaseLight) {
        // const lightColor = light.color.copy();

        let radius = 0;
        let outerConeCos = 0;
        let innerConeCos = 0;

        let matWorld: mat4 = light.worldTransform.copyTo();
        let matShadow: mat4 = new mat4();
        // if light do not cast shadow, use a zero matrix
        // matShadow.setIdentity();
        matShadow.reset();
        if (light.type === LightType.Point) {
            radius = (light as PointLight).range;
        }
        else if (light.type === LightType.Spot) {
            const spot: SpotLight = (light as SpotLight);
            radius = spot.range;
            outerConeCos = Math.cos(spot.outerConeAngle);
            innerConeCos = Math.cos(spot.innerConeAngle);
        }
        else if (light.type === LightType.Directional) {
            const dir: DirectionalLight = light as DirectionalLight;
            //radius = (dir.radius === 0 ? 1e7 : dir.radius);
            radius = dir.radius;
        }

        // shadow matrix
        if (light.shadow && light.castShadow && light.shadow.shadowMap) {
            // NOTE: these matrices is for sample shadow map, not for render shadow map.
            // todo: shadow bias matrix
            const mapRects = light.shadow.mapRects;
            const invSize: vec4 = new vec4([1.0/light.shadow.shadowMap.width, 1.0/light.shadow.shadowMap.height,
                                            1.0/light.shadow.shadowMap.width, 1.0/light.shadow.shadowMap.height]);
            
            if (light.type === LightType.Point) {

                // fill light world position and 6 map rects in transform and shadow matrix
                matWorld.setRow(0, light.worldTransform.row(3));

                // todo: need to scale rect to [0, 1]
                const normRect = new vec4();
                matWorld.setRow(1, mapRects[0].copyTo(normRect).multiply(invSize));
                matWorld.setRow(2, mapRects[1].copyTo(normRect).multiply(invSize));
                matWorld.setRow(3, mapRects[2].copyTo(normRect).multiply(invSize));

                matShadow.setRow(0, mapRects[3].copyTo(normRect).multiply(invSize));
                matShadow.setRow(1, mapRects[4].copyTo(normRect).multiply(invSize));
                matShadow.setRow(2, mapRects[5].copyTo(normRect).multiply(invSize));
                // shadowmap bias
                normRect.x = light.shadow.bias;
                normRect.y = 0; normRect.z = 0; normRect.w = 1;
                matShadow.setRow(3, normRect);

            } else {

                let matBias = new mat4();
                matBias.fromTranslation(new vec3([0, 0, light.shadow.bias]));
                // todo: shadowmap atlas rect as viewport matrix
                const normRect = mapRects[0].copyTo();
                normRect.multiply(invSize);
                const l = normRect.x;
                const b = normRect.y;
                const w = normRect.z;
                const h = normRect.w;
                // let w = light.shadow.mapRects[0].z / light.shadow.shadowMap.width;
                // let h = light.shadow.mapRects[0].w / light.shadow.shadowMap.height;
                // // todo: translation
                // let l = light.shadow.mapRects[0].x / light.shadow.shadowMap.width;
                // let b = light.shadow.mapRects[0].y / light.shadow.shadowMap.height;
                // ndc space is [-1, 1]
                // texcoord uv space is [0,1]
                // depth range in depthbuffer is also [0,1]
                // so need to apply * 0.5 + 0.5
                // and shadowmap altas rectangle, same as viewport
                let matLightViewport = new mat4([
                    w * 0.5,     0,           0,   0,
                    0,           h * 0.5,     0,   0,
                    0,           0,           0.5, 0,
                    w * 0.5 + l, h * 0.5 + b, 0.5, 1,
                ]);
                // note: shadow bias should be add after projection
                mat4.product(light.shadow.matProj, light.shadow.matView, matShadow);
                mat4.product(matBias, matShadow, matShadow);
                mat4.product(matLightViewport, matShadow, matShadow);
            }
        }
        light.color.scale(light.intensity, this._tmpColor);
        buffer.addArray(this._tmpColor.values);
        buffer.addArray(matWorld.values);
        buffer.addNumber(light.type);
        buffer.addNumber(radius);
        buffer.addNumber(outerConeCos);
        buffer.addNumber(innerConeCos);
        buffer.addArray(matShadow.values);
    }

    // public fillUniformBuffersPerFrame() {
    //     // todo: set frame time
    //     // where to get time?
    //     const time = 0;
    //     this._ubFrame.setFloat("time", time);
    //     this._ubFrame.update();
    // }

    public fillUniformBuffersPerView(camera: Camera,
                                    lights: boolean = true,
                                    decals: boolean = true,
                                    reflprobes: boolean = true,
                                    irrprobes: boolean = true,
                                    useClusters: boolean = false) {

        let invView: mat4 = camera.viewTransform.copyTo();
        let invProj: mat4 = camera.projTransform.copyTo();
        invView.inverse();
        invProj.inverse();

        // todo: fill view and proj matrix
        this._ubView.setMat4("matView", camera.viewTransform);

        this._ubView.setMat4("matProj", camera.projTransform);
        this._ubView.setMat4("matInvView", invView);
        this._ubView.setMat4("matInvProj", invProj);

        this._ubView.setMat4("matViewProjPrev", camera.viewTransformPrev);

        const viewport: Int32Array = GLDevice.gl.getParameter(GLDevice.gl.VIEWPORT);
        const vpVec = new vec4([viewport[0], viewport[1], viewport[2], viewport[3]]);
        this._ubView.setVec4("viewport", vpVec);

        let camPosition = new vec3();
        camera.worldTransform.getTranslation(camPosition);
        this._ubView.setVec3("position", camPosition);

        this._ubView.setFloat("time", Clock.instance.curTime);

        const zRange = new vec2([camera.near, camera.far]);
        this._ubView.setVec2("zRange", zRange);

        // todo: how to get full rendertarget size?
        // for post processes, the scene will be rendered to an off-screen FBO default.
        let rtSize = new vec2([vpVec.z, vpVec.w]);
        if (GLDevice.renderTarget) {
            const texture = GLDevice.renderTarget.getTexture(0) as Texture2D;
            if (texture) {
                rtSize.x = texture.width;
                rtSize.y = texture.height;
            }
        }
        this._ubView.setVec2("rtSize", rtSize);

        // todo: calculate far plane rect
        // use inverse projection transform?


        // NDC space corners
        const leftBottom = new vec4([-1, -1, 1, 1]);
        const rightTop = new vec4([1, 1, 1, 1]);

        let farLeftBottom = new vec4();
        let farRightTop = new vec4();
        invProj.multiplyVec4(leftBottom, farLeftBottom);
        invProj.multiplyVec4(rightTop, farRightTop);
        //vec4.transformMat4(farLeftBottom, leftBottom, invProj);
        //vec4.transformMat4(farRightTop, rightTop, invProj);

        // don't forget divide by w
        const farRect = new vec4([farLeftBottom.x / farLeftBottom.w, farLeftBottom.y / farLeftBottom.w, farRightTop.x / farRightTop.w, farRightTop.y / farRightTop.w]);
        this._ubView.setVec4("farRect", farRect);

        const clusterParams = new vec4([1,1,0,0]);  // use 0 for z and w can force slice = 0
        if (useClusters) {
            clusterParams.x = ClusteredForwardRenderContext.NUM_CLUSTERS_X;
            clusterParams.y = ClusteredForwardRenderContext.NUM_CLUSTERS_Y;
            // clusterParams.z = ClusteredForwardRenderContext.NUM_CLUSTERS_Z;

            // http://www.aortiz.me/2018/12/21/CG.html, solving slice from DOOM like equation
            const numSlices = ClusteredForwardRenderContext.NUM_CLUSTERS_Z;
            const logFarOverNear = Math.log(camera.far/camera.near)
            clusterParams.z = numSlices / logFarOverNear;
            clusterParams.w = - numSlices * Math.log(camera.near) / logFarOverNear;
        }
        this._ubView.setVec4("clusterParams", clusterParams);

        this._ubView.update();

        // todo: fill dynamic lights and decals
        // check visibility?
        this.fillItemsPerView(camera, camPosition, useClusters, lights, decals, reflprobes, irrprobes);
    }

    private fillItemsPerView(camera: Camera, camPosition: vec3, useClusters: boolean, lights: boolean, decals: boolean, envprobes: boolean, irrprobes: boolean) {
        // dynamic lights and decals
        if (lights) {
            if (this.dynamicLightCount > 0) {
                this._buffer.seek(0);
                // for (const light of this.dynamicLights) {
                for(let i = 0; i < this.dynamicLightCount; i++) {
                    const light = this.dynamicLights[i];
                    this.addLightToBuffer(this._buffer, light);
                }
                // how to append to the end of the light ubo? or use another ubo?
                // update from the static light count * one light size in ubo
                this._ubLights.updateByData(this._tmpData, this.staticLightCount * ClusteredForwardRenderContext.LIGHT_SIZE_FLOAT * 4, 0, this._buffer.length);
            }
        }
 
        if (decals) {
            if (this.dynamicDecalCount > 0) {
                this._buffer.seek(0);
                for (let i = 0; i < this.dynamicDecalCount; i++) {
                    const decal = this.dynamicDecals[i];
                    this.addDecalToBuffer(this._buffer, decal);
                }
                this._ubDecals.updateByData(this._tmpData, this.staticDecalCount * ClusteredForwardRenderContext.DECAL_SIZE_FLOAT * 4, 0, this._buffer.length);
            }
        }

        // envprobes and irradiance probes are always static
        // test: add all item indices, and assume only one cluster
        this._clusterBuffer.seek(0);
        this._idxBuffer.seek(0);

        if (useClusters) {
            // todo: use cluster grid to cull objects
            // check if the frustum has changed?
            // fix me: othographic cameras?
            if (camera instanceof PerspectiveCamera) {
                const perspCamera = camera as PerspectiveCamera;
                const fovRad = perspCamera.fov * Math.PI / 180.0;
                const tanHalfFov = Math.tan(fovRad * 0.5);
                const right = perspCamera.near * tanHalfFov * perspCamera.aspect;
                const left = -right;
                const top = perspCamera.near * tanHalfFov;
                const bottom = -top;
                this._clusterGrid.setFrustumParams(left, right, bottom, top, camera.near, camera.far);
                perspCamera.viewTransform.copyTo(this._clusterGrid.viewTransform);
                // this._clusterGrid.viewTransform = perspCamera.viewTransform;

                this.fillItemsToCluster(lights, decals, envprobes, irrprobes);
                
                // debug fill all
                // this.fillAllItemsToCluster(lights, decals, envprobes, camPosition, irrprobes);
            }
        }
        else {
            // fill all items
            this.fillAllItemsToCluster(lights, decals, envprobes, camPosition, irrprobes);
        }

        this._ubItemIndices.updateByData(this._tmpIdxData, 0, 0, this._idxBuffer.length);
        this._ubClusters.updateByData(this._tmpClusterData, 0, 0, this._clusterBuffer.length);
    }

    private fillItemsToCluster(lights: boolean, decals: boolean, envprobes: boolean, irrprobes: boolean) {
        const clusterGrid = this._clusterGrid;
        clusterGrid.clearItems();

        // todo: iterate lights, decals and envprobes, fill to cluster grid
        // fix me: is the range used to cull same as used in shader?
        if (lights) {
            for (let iLight = 0; iLight < this.staticLightCount; iLight++) {
                const light = this.staticLights[iLight];
                if (light.on) {
                    clusterGrid.fillLight(light, iLight);
                }
            }
            for (let iLight = 0; iLight < this.dynamicLightCount; iLight++) {
                const light = this.dynamicLights[iLight];
                if (light.on) {
                    clusterGrid.fillLight(light, iLight + this.staticLightCount);
                }
            }
        }

        if (decals) {
            for (let iDecal = 0; iDecal < this.staticDecalCount; iDecal++) {
                const decal = this.staticDecals[iDecal];
                if (decal.visible) {
                    clusterGrid.fillDecal(decal, iDecal);
                }
            }
            for (let iDecal = 0; iDecal < this.dynamicDecalCount; iDecal++) {
                const decal = this.dynamicDecals[iDecal];
                if (decal.visible) {
                    clusterGrid.fillDecal(decal, iDecal + this.staticDecalCount);
                }
            }
        }

        if (envprobes) {
            for (let iEnv = 0; iEnv < this.envProbeCount; iEnv++) {
                const envProbe = this.envProbes[iEnv];
                if (envProbe.visible) {
                    clusterGrid.fillReflectionProbe(envProbe, iEnv);
                }
            }
        }

        if (irrprobes) {
            for (let iIrr = 0; iIrr < this.irradianceProbeCount; iIrr++) {
                const irrProbe = this.irradianceProbes[iIrr];
                if (irrProbe.visible) {
                    clusterGrid.fillIrradianceProbe(irrProbe, iIrr);
                }
            }
        }

        // todo: iterate all clusters, use lists in clusters to update uniform buffers;
        let start: number = 0;
        for (let slice = 0; slice < clusterGrid.resolusion.z; slice++) {
            for (let row = 0; row < clusterGrid.resolusion.y; row++) {
                for (let col = 0; col < clusterGrid.resolusion.x; col++) {
                    const cluster = clusterGrid.clusters[slice][row][col];
                    for (let iLight = 0; iLight < cluster.lightCount; iLight++) {
                        this._idxBuffer.addNumber(cluster.getLight(iLight));
                    }
                    for (let iDecal = 0; iDecal < cluster.decalCount; iDecal++) {
                        this._idxBuffer.addNumber(cluster.getDecal(iDecal));
                    }
                    for (let iRefl = 0; iRefl < cluster.reflProbeCount; iRefl++ ) {
                        this._idxBuffer.addNumber(cluster.getReflProbe(iRefl));
                    }
                    for (let iIrr = 0; iIrr < cluster.irrProbeCount; iIrr++) {
                        this._idxBuffer.addNumber(cluster.getIrrProbe(iIrr));
                    }
                    this._clusterBuffer.addNumber(start);
                    this._clusterBuffer.addNumber(cluster.lightCount);
                    this._clusterBuffer.addNumber(cluster.decalCount);
                    this._clusterBuffer.addNumber(cluster.reflProbeCount * 65536 + cluster.irrProbeCount);

                    start += cluster.lightCount + cluster.decalCount + cluster.reflProbeCount + cluster.irrProbeCount;
                }
            }
        }
    }

    private fillAllItemsToCluster(lights: boolean, decals: boolean, envprobes: boolean, camPosition: vec3, irrprobes: boolean) {
        let start = 0;
        let lightCount = 0;
        let decalCount = 0;
        let envProbeCount = 0;
        let irrProbeCount = 0;

        // todo: frustum culling ?
        // not necessary, because this funciton is mostly for rendering enviroment maps, and their size is small (about 64)
        // maybe doing frustum culling by js is even slower than executing every lights,... for pixels in shader...

        if (lights) {
            for (let iLight = 0; iLight < this.staticLightCount; iLight++) {
                const light = this.staticLights[iLight];
                if (light.on) {
                    this._idxBuffer.addNumber(iLight);
                    lightCount++;
                }
            }
            for (let iLight = 0; iLight < this.dynamicLightCount; iLight++) {
                const light = this.dynamicLights[iLight];
                if (light.on) {
                    this._idxBuffer.addNumber(iLight + this.staticLightCount);
                    lightCount++;
                }
            }
        }

        if (decals) {
            for (let iDecal = 0; iDecal < this.staticDecalCount; iDecal++) {
                const decal = this.staticDecals[iDecal];
                // todo: check decal distance; cull against clusters
                if (decal.visible) {
                    this._idxBuffer.addNumber(iDecal);
                    decalCount++;
                }
            }
            for (let iDecal = 0; iDecal < this.dynamicDecalCount; iDecal++) {
                const decal = this.dynamicDecals[iDecal];
                if (decal.visible) {
                    this._idxBuffer.addNumber(iDecal + this.staticDecalCount);
                    decalCount++;
                }
            }
        }

        if (envprobes) {
            for (let iEnv = 0; iEnv < this.envProbeCount; iEnv++) {
                const envProbe = this.envProbes[iEnv];
                if (envProbe.visible) {
                    // check visible distance
                    // because envprobes are static, it will be dispatched to rendercontext only when the current scene changed.
                    // so we need to check the visible distance here.
                    const position = new vec3();
                    envProbe.worldTransform.getTranslation(position);
                    const dist = vec3.distance(position, camPosition);
                    if (dist < envProbe.visibleDistance) {
                        this._idxBuffer.addNumber(iEnv);
                        envProbeCount++;
                    }
                }
            }
        }

        if (irrprobes) {
            for (let iIrr = 0; iIrr < this.irradianceProbeCount; iIrr++) {
                const irrProbe = this.irradianceProbes[iIrr];
                if (irrProbe.visible) {
                    this._idxBuffer.addNumber(iIrr);
                    irrProbeCount++;
                }
            }
        }

        this._clusterBuffer.addNumber(start); // the start index of this cluster
        this._clusterBuffer.addNumber(lightCount); // light count
        this._clusterBuffer.addNumber(decalCount); // decal count
        this._clusterBuffer.addNumber(envProbeCount * 65536 + irrProbeCount); // envprobe (high 2 bytes) and irradiance volume count (low 2 bytes)


        // this._clusterBuffer.addNumber(envProbeCount);
        // this._clusterBuffer.addNumber(irrProbeCount);
        start += lightCount + decalCount + envProbeCount + irrProbeCount;
    }

    public fillUniformBuffersPerLightView(light: BaseLight, viewIdx: number) {
        // todo: calculate shadow view proj transform matrices
        // implement in light class?
        if (light.shadow && light.castShadow) {
            // todo: need special logic for point lights.
            if (light.type === LightType.Point) {
                const matView = TextureCube.getFaceViewMatrix(viewIdx).copyTo();
                // need to translate to light local space first
                const matWorldToLight: mat4 = new mat4();
                matWorldToLight.fromTranslation(light.worldTransform.getTranslation().scale(-1));
                mat4.product(matView, matWorldToLight, matView);
                this._ubView.setMat4("matView", matView);
            } else {
                this._ubView.setMat4("matView", light.shadow.matView);
            }
            this._ubView.setMat4("matProj", light.shadow.matProj);
            this._ubView.setFloat("time", Clock.instance.curTime);
            this._ubView.update();
        }
    }

    public fillUniformBuffersPerObject(item: RenderItem) {

        let matWorld = item.object.worldTransform;
        let matWorldPrev = item.object.worldTransformPrev
        // object properties
        this._tmpColor.x = item.object.tag;
        this._tmpColor.y = 0;           // num skin joints
        this._tmpColor.z = 0;           // use instancing
        this._tmpColor.w = 0;

        if (item.object instanceof SkinMesh) {
            // fix me: need to copy all matrices to a float32array?
            const skinMesh = item.object as SkinMesh;
            this._tmpColor.y = skinMesh.jointMatrices.length;

            this._buffer.seek(0);
            for (let i = 0; i < skinMesh.jointMatrices.length; i++) {
                this._buffer.addArray(skinMesh.jointMatrices[i].values);
            }
            this._ubObject.setUniform("matBones", this._tmpData, this._buffer.length);
        } else if(item.object instanceof InstancedMesh) {
            // this is important ! for instanced meshes, must pass in identity !!
            matWorld = mat4.identity;
            matWorldPrev = mat4.identity;
            this._tmpColor.z = 1;
        }
        this._ubObject.setMat4("matWorld", matWorld);
        this._ubObject.setMat4("matWorldPrev", matWorldPrev);
        this._ubObject.setVec4("color", item.object.color);
        this._ubObject.setVec4("props", this._tmpColor);
        this._ubObject.update();
    }

    public fillUniformBuffersPerObjectByValues(matWorld: mat4, matWorldPrev: mat4, color: vec4, tag: number, numSkinJoints:number, instancing: boolean, custom: number = 0) {
        this._ubObject.setMat4("matWorld", matWorld);
        this._ubObject.setMat4("matWorldPrev", matWorldPrev);
        this._ubObject.setVec4("color", color);
        this._tmpColor.x = tag;
        this._tmpColor.y = numSkinJoints;
        this._tmpColor.z = instancing ? 1: 0;
        this._tmpColor.w = custom;
        this._ubObject.setVec4("props", this._tmpColor);
        this._ubObject.update();
    }

    /** only handle stdpbr material now */
    public fillUniformBuffersPerMaterial(material: Material | null) {
        // if pbr material, fill pbr uniform buffer
        if (material) {
            if (material instanceof StandardPBRMaterial) {
                const stdPBRMtl = material as StandardPBRMaterial;
                this._ubMaterialPBR.setVec4("baseColor", stdPBRMtl.color);
                this._ubMaterialPBR.setVec4("emissive", stdPBRMtl.emissive);

                this._ubMaterialPBR.setVec3("subsurfaceColor", stdPBRMtl.subsurfaceColor);
                this._ubMaterialPBR.setFloat("subsurface", stdPBRMtl.subsurface);

                this._ubMaterialPBR.setFloat("subsurfaceRadius", stdPBRMtl.subsurface);
                this._ubMaterialPBR.setFloat("subsurfacePower", stdPBRMtl.subsurface);
                this._ubMaterialPBR.setFloat("subsurfaceThickness", stdPBRMtl.subsurface);
                this._ubMaterialPBR.setFloat("specular", stdPBRMtl.specular);

                this._ubMaterialPBR.setFloat("metallic", stdPBRMtl.metallic);
                this._ubMaterialPBR.setFloat("roughness", stdPBRMtl.roughness);
                this._ubMaterialPBR.setFloat("colorMapAmount", stdPBRMtl.colorMapAmount);
                this._ubMaterialPBR.setFloat("metallicMapAmount", stdPBRMtl.metallicMapAmount);
                
                this._ubMaterialPBR.setFloat("roughnessMapAmount", stdPBRMtl.roughnessMapAmount);
                this._ubMaterialPBR.setFloat("normalMapAmount", stdPBRMtl.normalMapAmount);
                this._ubMaterialPBR.setFloat("occlusionMapAmount", stdPBRMtl.occlusionMapAmount);
                this._ubMaterialPBR.setFloat("emissiveMapAmount", stdPBRMtl.emissiveMapAmount);
                this._ubMaterialPBR.update();
            }
        }
    }
}
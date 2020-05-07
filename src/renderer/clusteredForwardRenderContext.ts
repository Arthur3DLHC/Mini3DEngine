import { RenderContext } from "./renderContext.js";
import { BufferHelper } from "../utils/bufferHelper.js";
import { ClusteredForwardRenderer } from "./clusteredForwardRenderer.js";
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

export class ClusteredForwardRenderContext extends RenderContext {
    public constructor() {
        super();

        this._tmpData = new Float32Array(4096);
        this._buffer = new BufferHelper(this._tmpData);

        this._tmpIdxData = new Uint32Array(4096);
        this._idxBuffer = new BufferHelper(this._tmpIdxData);

        this._tmpClusterData = new Uint32Array(ClusteredForwardRenderer.NUM_CLUSTERS * ClusteredForwardRenderer.CLUSTER_SIZE_INT);
        this._clusterBuffer = new BufferHelper(this._tmpClusterData);

        this._ubLights = new UniformBuffer();
        this._ubDecals = new UniformBuffer();
        this._ubEnvProbes = new UniformBuffer();
        this._ubIrrVolumes = new UniformBuffer();
        this._ubFrame = new UniformBuffer();
        this._ubView = new UniformBuffer();
        this._ubItemIndices = new UniformBuffer();
        this._ubClusters = new UniformBuffer();
        this._ubObject = new UniformBuffer();
        this._ubMaterialPBR = new UniformBuffer();

        this.setUniformBufferLayouts();

        this._ubLights.build();
        this._ubDecals.build();
        this._ubEnvProbes.build();
        this._ubIrrVolumes.build();
        this._ubFrame.build();
        this._ubView.build();
        this._ubItemIndices.build();
        this._ubClusters.build();
        this._ubObject.build();
        this._ubMaterialPBR.build();

        this.setUniformBlockBindingPoints();
        this.bindUniformBuffers();
    }

    private _tmpData: Float32Array;
    private _buffer: BufferHelper;
    private _tmpIdxData: Uint32Array;
    private _idxBuffer: BufferHelper;
    private _tmpClusterData: Uint32Array;
    private _clusterBuffer: BufferHelper;

    // uniform buffers
    private _ubLights: UniformBuffer;
    private _ubDecals: UniformBuffer;
    private _ubEnvProbes: UniformBuffer;
    private _ubIrrVolumes: UniformBuffer;
    private _ubFrame: UniformBuffer;
    private _ubView: UniformBuffer;
    private _ubItemIndices: UniformBuffer;
    private _ubClusters: UniformBuffer;
    private _ubObject: UniformBuffer;
    private _ubMaterialPBR: UniformBuffer;

    private setUniformBufferLayouts() {
        // per scene
        const MAX_LIGHTS = 512;
        const MAX_DECALS = 1024;
        const MAX_ENVPROBES = 1024;
        const MAX_IRRVOLUMES = 512;
        // TODO: 带结构和数组的 uniform buffer 怎么初始化和更新值？
        // 数组长度 * 对齐后的结构浮点数个数
        this._ubLights.addUniform("lights", MAX_LIGHTS * ClusteredForwardRenderer.LIGHT_SIZE_FLOAT);
        this._ubDecals.addUniform("decals", MAX_DECALS * ClusteredForwardRenderer.DECAL_SIZE_FLOAT);
        this._ubEnvProbes.addUniform("probes", MAX_ENVPROBES * ClusteredForwardRenderer.ENVPROBE_SIZE_FLOAT);
        this._ubIrrVolumes.addUniform("volumes", MAX_IRRVOLUMES * ClusteredForwardRenderer.IRRVOL_SIZE_FLOAT);

        // per frame,
        this._ubFrame.addFloat("time", 0);

        // per view,
        const matIdentity = mat4.identity;
        this._ubView.addMat4("matView", matIdentity);
        this._ubView.addMat4("matViewPrev", matIdentity);
        this._ubView.addMat4("matProj", matIdentity);
        this._ubView.addMat4("matProjPrev", matIdentity);
        this._ubView.addVec4("viewport", new vec4());
        this._ubView.addVec3("position", new vec3());
        this._ubView.addVec2("zRange", new vec2());
        this._ubView.addVec2("rtSize", new vec2());
        this._ubView.addVec4("farRect", new vec4());

        const MAX_ITEMS = 4096;
        this._ubItemIndices.addUniform("indices", MAX_ITEMS);

        const NUM_CLUSTERS = 16 * 8 * 24;
        this._ubClusters.addUniform("clusters", NUM_CLUSTERS * 4);

        // per obj
        const MAX_BONES = 256;
        this._ubObject.addMat4("matWorld", matIdentity);
        this._ubObject.addMat4("matPrevWorld", matIdentity);
        this._ubObject.addVec4("color", new vec4());
        // this._ubObject.addFloat("tag", 0);
        this._ubObject.addUniform("matBones", MAX_BONES * 16);
        this._ubObject.addUniform("matPrevBones", MAX_BONES * 16);

        // per mtl
        // default pbr material
        this._ubMaterialPBR.addVec4("baseColor", new vec4());
        this._ubMaterialPBR.addVec4("emissive", new vec4());
        this._ubMaterialPBR.addVec3("subsurfaceColor", new vec3());
        this._ubMaterialPBR.addFloat("subsurface", 0);
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
        GLUniformBuffers.uniformBlockNames["IrrVolumes"] = 3;
        GLUniformBuffers.uniformBlockNames["Frame"] = 4;
        GLUniformBuffers.uniformBlockNames["View"] = 5;
        GLUniformBuffers.uniformBlockNames["ItemIndices"] = 6;
        GLUniformBuffers.uniformBlockNames["Clusters"] = 7;
        GLUniformBuffers.uniformBlockNames["Object"] = 8;
        GLUniformBuffers.uniformBlockNames["Material"] = 9;
    }

    private bindUniformBuffers() {
        GLUniformBuffers.bindUniformBuffer(this._ubLights, "Lights");
        GLUniformBuffers.bindUniformBuffer(this._ubDecals, "Decals");
        GLUniformBuffers.bindUniformBuffer(this._ubEnvProbes, "EnvProbes");
        GLUniformBuffers.bindUniformBuffer(this._ubIrrVolumes, "IrrVolumes");
        GLUniformBuffers.bindUniformBuffer(this._ubFrame, "Frame");
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
        GLUniformBuffers.bindUniformBlock(program, "IrrVolumes");
        GLUniformBuffers.bindUniformBlock(program, "Frame");
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
        // all irradiance volumes
        // pay attention to uniform alignment;

        this._buffer.seek(0);
        for (const light of this.staticLights) {
            this.addLightToBufer(this._buffer, light);
        }
        this._ubLights.setUniform("lights", this._tmpData, this._buffer.length);
        this._ubLights.update();
        this._buffer.seek(0);
        for (const decal of this.staticDecals) {
            this.addDecalToBuffer(this._buffer, decal);
        }
        this._ubDecals.setUniform("decals", this._tmpData, this._buffer.length);
        this._buffer.seek(0);
        for (const probe of this.envProbes) {
            let position = new vec3();
            probe.worldTransform.getTranslation(position);
            this._buffer.addArray(position.values);
            this._buffer.addNumber(probe.textureIndex);
        }
        this._ubEnvProbes.setUniform("probes", this._tmpData, this._buffer.length);
        this._buffer.seek(0);
        for (const vol of this.irradianceVolumes) {
            const row0 = vol.worldTransform.row(0);
            const row1 = vol.worldTransform.row(1);
            const row2 = vol.worldTransform.row(2);
            this._buffer.addArray(row0.values);
            this._buffer.addArray(row1.values);
            this._buffer.addArray(row2.values);
            const boxMin = vol.atlasLocation.minPoint.copy();
            const boxMax = vol.atlasLocation.maxPoint.copy();
            this._buffer.addArray(boxMin.values);
            this._buffer.addArray(boxMax.values);
        }
        this._ubIrrVolumes.setUniform("volumes", this._tmpData, this._buffer.length);
    }

    private addDecalToBuffer(buffer: BufferHelper, decal: Decal) {
        const row0 = decal.worldTransform.row(0);
        const row1 = decal.worldTransform.row(1);
        const row2 = decal.worldTransform.row(2);
        buffer.addArray(row0.values);
        buffer.addArray(row1.values);
        buffer.addArray(row2.values);
        buffer.addArray(decal.atlasRect.values);
    }

    private addLightToBufer(buffer: BufferHelper, light: BaseLight) {
        buffer.addNumber(light.type);
        const lightColor = light.color.copy();
        buffer.addArray(lightColor.values);
        // transform
        const row0 = light.worldTransform.row(0);
        const row1 = light.worldTransform.row(1);
        const row2 = light.worldTransform.row(2);
        buffer.addArray(row0.values);
        buffer.addArray(row1.values);
        buffer.addArray(row2.values);
        let radius = 0;
        let angle = 0;
        let penumbra = 0;
        let unused = 0;
        if (light.type === LightType.Point) {
            radius = (light as PointLight).distance;
        }
        else if (light.type === LightType.Spot) {
            const spot = (light as SpotLight);
            radius = spot.distance;
            angle = spot.angle * Math.PI / 180.0;
            penumbra = spot.penumbra;
        }
        buffer.addNumber(radius);
        buffer.addNumber(angle);
        buffer.addNumber(penumbra);
        buffer.addNumber(unused); // uniform align
        if (light.shadow) {
            buffer.addArray(light.shadow.mapRect.values);
        }
        else {
            buffer.addArray(new vec4().values);
        }
    }

    public fillUniformBuffersPerFrame() {
        // todo: set frame time
        // where to get time?
        const time = 0;
        this._ubFrame.setFloat("time", time);
        this._ubFrame.update();
    }

    public fillUniformBuffersPerView(camera: Camera) {
        const tmpMat = mat4.identity.copy();
        // todo: fill view and proj matrix
        this._ubView.setMat4("matView", camera.viewTransform);
        // todo: prev view matrix
        this._ubView.setMat4("matViewPrev", camera.viewTransformPrev);

        this._ubView.setMat4("matProj", camera.projTransform);
        this._ubView.setMat4("matProjPrev", camera.projTransformPrev);

        const viewport: Int32Array = GLDevice.gl.getParameter(GLDevice.gl.VIEWPORT);
        const vpVec = new vec4([viewport[0], viewport[1], viewport[2], viewport[3]]);
        this._ubView.setVec4("viewport", vpVec);

        let camPosition = new vec3();
        camera.worldTransform.getTranslation(camPosition);
        this._ubView.setVec3("position", camPosition);

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
        let invProj: mat4 = camera.projTransform.copy();
        invProj.inverse();

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

        this._ubView.update();

        // todo: fill dynamic lights and decals
        // check visibility?
        this.fillItemsPerView();
    }

    private fillItemsPerView() {
        this._buffer.seek(0);
        for (const light of this.dynamicLights) {
            this.addLightToBufer(this._buffer, light);
        }
        // how to append to the end of the light ubo? or use another ubo?
        // update from the static light count * one light size in ubo
        this._ubLights.updateByData(this._tmpData, this.staticLights.length * ClusteredForwardRenderer.LIGHT_SIZE_FLOAT * 4);
        this._buffer.seek(0);
        for (const decal of this.dynamicDecals) {
            this.addDecalToBuffer(this._buffer, decal);
        }
        this._ubDecals.updateByData(this._tmpData, this.staticDecals.length * ClusteredForwardRenderer.DECAL_SIZE_FLOAT * 4);
        // envprobes and irradiance volumes are always static
        // test: add all item indices, and assume only one cluster
        let start = 0;
        this._clusterBuffer.seek(0);
        this._idxBuffer.seek(0);
        for (let iCluster = 0; iCluster < 1; iCluster++) {
            // todo: calculate clip space cluster AABB
            // todo: cull all items (both static and dynamic) by this cluster
            // fill visible item indices
            let lightCount = 0;
            let decalCount = 0;
            let envProbeCount = 0;
            let irrVolCount = 0;
            for (let iLight = 0; iLight < this.staticLights.length; iLight++) {
                const light = this.staticLights[iLight];
                // todo: cull light against cluster
                // for test perpurse new, add them all:
                this._idxBuffer.addNumber(iLight);
                lightCount++;
            }
            for (let iLight = 0; iLight < this.dynamicLights.length; iLight++) {
                const light = this.dynamicLights[iLight];
                this._idxBuffer.addNumber(iLight + this.staticLights.length);
                lightCount++;
            }
            for (let iDecal = 0; iDecal < this.staticDecals.length; iDecal++) {
                const decal = this.staticDecals[iDecal];
                this._idxBuffer.addNumber(iDecal);
                decalCount++;
            }
            for (let iDecal = 0; iDecal < this.dynamicDecals.length; iDecal++) {
                const decal = this.dynamicDecals[iDecal];
                this._idxBuffer.addNumber(iDecal + this.staticDecals.length);
                decalCount++;
            }
            for (let iEnv = 0; iEnv < this.envProbes.length; iEnv++) {
                const envProbe = this.envProbes[iEnv];
                this._idxBuffer.addNumber(iEnv);
                envProbeCount++;
            }
            // pack envprobe and irrvolume count together
            for (let iIrr = 0; iIrr < this.irradianceVolumes.length; iIrr++) {
                const irrVol = this.irradianceVolumes[iIrr];
                this._idxBuffer.addNumber(iIrr);
                irrVolCount++;
            }
            this._clusterBuffer.addNumber(start);       // the start index of this cluster
            this._clusterBuffer.addNumber(lightCount);       // light count
            this._clusterBuffer.addNumber(decalCount);       // decal count
            this._clusterBuffer.addNumber(envProbeCount * 65536 + irrVolCount);        // envprobe (high 2 bytes) and irradiance volume count (low 2 bytes)
            start += lightCount + decalCount + envProbeCount + irrVolCount;
        }

        this._ubItemIndices.updateByData(this._tmpIdxData, 0);
        this._ubClusters.updateByData(this._tmpClusterData, 0);
    }

    public fillUniformBuffersPerObject(item: RenderItem) {
        this._ubObject.setMat4("matWorld", item.object.worldTransform);
        this._ubObject.setMat4("matWorldPrev", item.object.worldTransformPrev);
        this._ubObject.setVec4("color", item.object.color);

        // todo: object skin transforms, if skinmesh
    }

    public fillUniformBuffersPerMaterial(material: Material | null) {
        // if pbr material, fill pbr uniform buffer
        if (material) {
            if (material instanceof StandardPBRMaterial) {
                const stdPBRMtl = material as StandardPBRMaterial;
                this._ubMaterialPBR.setVec4("baseColor", stdPBRMtl.color);
                this._ubMaterialPBR.setVec4("emissive", stdPBRMtl.emissive);
                this._ubMaterialPBR.setVec3("subsurfaceColor", stdPBRMtl.subsurfaceColor);
                this._ubMaterialPBR.setFloat("subsurface", stdPBRMtl.subsurface);
                this._ubMaterialPBR.setFloat("metallic", stdPBRMtl.metallic);
                this._ubMaterialPBR.setFloat("roughness", stdPBRMtl.roughness);
                this._ubMaterialPBR.setFloat("colorMapAmount", stdPBRMtl.colorMapAmount);
                this._ubMaterialPBR.setFloat("metallicMapAmount", stdPBRMtl.metallicMapAmount);
                this._ubMaterialPBR.setFloat("roughnessMapAmount", stdPBRMtl.roughnessMapAmount);
                this._ubMaterialPBR.setFloat("normalMapAmount", stdPBRMtl.normalMapAmount);
                this._ubMaterialPBR.setFloat("occlusionMapAmount", stdPBRMtl.occlusionMapAmount);
                this._ubMaterialPBR.setFloat("emissiveMapAmount", stdPBRMtl.emissiveMapAmount);
            }
        }
    }
}
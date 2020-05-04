import { RenderContext } from "./renderContext.js";
import { BufferHelper } from "../utils/bufferHelper.js";
import { ClusteredForwardRenderer } from "./clusteredForwardRenderer.js";
import { UniformBuffer } from "../WebGLResources/uniformBuffer.js";
import { mat4, vec4, vec3, vec2 } from "gl-matrix";
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

export class ClusteredForwardRenderContext extends RenderContext {
    public constructor() {
        super();

        this._tmpData = new Float32Array(4096);
        this._buffer = new BufferHelper(this._tmpData);

        this._tmpIdxData = new Int32Array(4096);
        this._idxBuffer = new BufferHelper(this._tmpIdxData);

        this._tmpClusterData = new Int32Array(ClusteredForwardRenderer.NUM_CLUSTERS * ClusteredForwardRenderer.CLUSTER_SIZE_INT);
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
    private _tmpIdxData: Int32Array;
    private _idxBuffer: BufferHelper;
    private _tmpClusterData: Int32Array;
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
        const matIdentity = mat4.create();
        this._ubView.addMat4("matView", matIdentity);
        this._ubView.addMat4("matViewPrev", matIdentity);
        this._ubView.addMat4("matProj", matIdentity);
        this._ubView.addMat4("matProjPrev", matIdentity);
        this._ubView.addVec4("viewport", vec4.create());
        this._ubView.addVec3("position", vec3.create());
        this._ubView.addVec2("zRange", vec2.create());
        this._ubView.addVec2("rtSize", vec2.create());
        this._ubView.addVec4("farRect", vec4.create());

        const MAX_ITEMS = 4096;
        this._ubItemIndices.addUniform("indices", MAX_ITEMS);

        const NUM_CLUSTERS = 16 * 8 * 24;
        this._ubClusters.addUniform("clusters", NUM_CLUSTERS * 4);

        // per obj
        const MAX_BONES = 256;
        this._ubObject.addMat4("matWorld", matIdentity);
        this._ubObject.addMat4("matPrevWorld", matIdentity);
        this._ubObject.addVec4("color", vec4.create());
        // this._ubObject.addFloat("tag", 0);
        this._ubObject.addUniform("matBones", MAX_BONES * 16);
        this._ubObject.addUniform("matPrevBones", MAX_BONES * 16);

        // per mtl
        // default pbr material
        this._ubMaterialPBR.addVec4("baseColor", vec4.create());
        this._ubMaterialPBR.addVec4("emissive", vec4.create());
        this._ubMaterialPBR.addVec3("subsurfaceColor", vec3.create());
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
        GLUniformBuffers.bindUniformBlock(program, "LiItemIndicesghts");
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
            this.addLightToBufer(this._buffer, light)
        }
        this._ubLights.setUniform("lights", this._tmpData, this._buffer.length);
        this._ubLights.update();
        this._buffer.seek(0);
        for (const decal of this.staticDecals) {
            this.addDecalToBuffer(this._buffer, decal)
        }
        this._ubDecals.setUniform("decals", this._tmpData, this._buffer.length);
        this._buffer.seek(0);
        for (const probe of this.envProbes) {
            const position = vec3.create();
            mat4.getTranslation(position, probe.worldTransform);
            this._buffer.addArray(position);
            this._buffer.addNumber(probe.textureIndex);
        }
        this._ubEnvProbes.setUniform("probes", this._tmpData, this._buffer.length);
        this._buffer.seek(0);
        for (const vol of this.irradianceVolumes) {
            const row0 = vec4.fromValues(vol.worldTransform[0], vol.worldTransform[1], vol.worldTransform[2], vol.worldTransform[3]);
            const row1 = vec4.fromValues(vol.worldTransform[4], vol.worldTransform[5], vol.worldTransform[6], vol.worldTransform[7]);
            const row2 = vec4.fromValues(vol.worldTransform[8], vol.worldTransform[9], vol.worldTransform[10], vol.worldTransform[11]);
            this._buffer.addArray(row0);
            this._buffer.addArray(row1);
            this._buffer.addArray(row2);
            const boxMin = vec4.from(vol.atlasLocation.minPoint);
            const boxMax = vec4.from(vol.atlasLocation.maxPoint);
            this._buffer.addArray(boxMin);
            this._buffer.addArray(boxMax);
        }
        this._ubIrrVolumes.setUniform("volumes", this._tmpData, this._buffer.length);
    }

    private addDecalToBuffer(buffer: BufferHelper, decal: Decal) {
        const row0 = vec4.fromValues(decal.worldTransform[0], decal.worldTransform[1], decal.worldTransform[2], decal.worldTransform[3])
        const row1 = vec4.fromValues(decal.worldTransform[4], decal.worldTransform[5], decal.worldTransform[6], decal.worldTransform[7])
        const row2 = vec4.fromValues(decal.worldTransform[8], decal.worldTransform[9], decal.worldTransform[10], decal.worldTransform[11])
        buffer.addArray(row0)
        buffer.addArray(row1)
        buffer.addArray(row2)
        buffer.addArray(decal.atlasRect)
    }

    private addLightToBufer(buffer: BufferHelper, light: BaseLight) {
        buffer.addNumber(light.type)
        const lightColor = vec3.from(light.color)
        buffer.addArray(lightColor)
        // transform
        const row0 = vec4.fromValues(light.worldTransform[0], light.worldTransform[1], light.worldTransform[2], light.worldTransform[3])
        const row1 = vec4.fromValues(light.worldTransform[4], light.worldTransform[5], light.worldTransform[6], light.worldTransform[7])
        const row2 = vec4.fromValues(light.worldTransform[8], light.worldTransform[9], light.worldTransform[10], light.worldTransform[11])
        buffer.addArray(row0)
        buffer.addArray(row1)
        buffer.addArray(row2)
        let radius = 0
        let angle = 0
        let penumbra = 0
        let unused = 0
        if (light.type === LightType.Point) {
            radius = (light as PointLight).distance
        }
        else if (light.type === LightType.Spot) {
            const spot = (light as SpotLight)
            radius = spot.distance
            angle = spot.angle * Math.PI / 180.0
            penumbra = spot.penumbra
        }
        buffer.addNumber(radius)
        buffer.addNumber(angle)
        buffer.addNumber(penumbra)
        buffer.addNumber(unused) // uniform align
        if (light.shadow) {
            buffer.addArray(light.shadow.mapRect)
        }
        else {
            buffer.addArray(vec4.create())
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
        const tmpMat = mat4.create();
        // todo: fill view and proj matrix
        this._ubView.setMat4("matView", camera.viewTransform);
        // todo: prev view matrix
        this._ubView.setMat4("matViewPrev", camera.viewTransformPrev);

        this._ubView.setMat4("matProj", camera.projTransform);
        this._ubView.setMat4("matProjPrev", camera.projTransformPrev);

        const viewport: Int32Array = GLDevice.gl.getParameter(GLDevice.gl.VIEWPORT);
        const vpVec = vec4.fromValues(viewport[0], viewport[1], viewport[2], viewport[3]);
        this._ubView.setVec4("viewport", vpVec);

        let camPosition = vec3.create();
        mat4.getTranslation(camPosition, camera.worldTransform);
        this._ubView.setVec3("position", camPosition);

        const zRange = vec2.fromValues(camera.near, camera.far);
        this._ubView.setVec2("zRange", zRange);

        // todo: how to get full rendertarget size?
        // for post processes, the scene will be rendered to an off-screen FBO default.
        let rtSize = vec2.fromValues(vpVec[2], vpVec[3]);
        if (GLDevice.renderTarget) {
            const texture = GLDevice.renderTarget.getTexture(0) as Texture2D;
            if (texture) {
                rtSize[0] = texture.width;
                rtSize[1] = texture.height;
            }
        }
        this._ubView.setVec2("rtSize", rtSize);

        // todo: calculate far plane rect
        // use inverse projection transform?
        let invProj = mat4.create();
        mat4.invert(invProj, camera.projTransform);

        // NDC space corners
        const leftBottom = vec4.fromValues(-1, -1, 1, 1);
        const rightTop = vec4.fromValues(1, 1, 1, 1);

        let farLeftBottom = vec4.create();
        let farRightTop = vec4.create();
        vec4.transformMat4(farLeftBottom, leftBottom, invProj);
        vec4.transformMat4(farRightTop, rightTop, invProj);

        // don't forget divide by w
        const farRect = vec4.fromValues(farLeftBottom[0] / farLeftBottom[3], farLeftBottom[1] / farLeftBottom[3], farRightTop[0] / farRightTop[3], farRightTop[1] / farRightTop[3]);
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
        // todo: cull all items (both static and dynamic) by clusters
        // fill visible item indices
        // test: add all item indices
        // fix me: how to add uint to uniform buffer?
        let start = 0;
        let count = 0;
        this._idxBuffer.seek(0);
        this._clusterBuffer.seek(0);
        for (let iLight = 0; iLight < this.staticLights.length; iLight++) {
            const light = this.staticLights[iLight];
            // todo: cull light against clusters
            // for test perpurse new, add them all:
            this._idxBuffer.addNumber(iLight);
            count++;
        }
        for (let iLight = 0; iLight < this.dynamicLights.length; iLight++) {
            const light = this.dynamicLights[iLight];
            this._idxBuffer.addNumber(iLight + this.staticLights.length);
            count++;
        }
        this._clusterBuffer.addNumber(start);
        this._clusterBuffer.addNumber(count);
        start = count;
        count = 0;
        for (let iDecal = 0; iDecal < this.staticDecals.length; iDecal++) {
            const decal = this.staticDecals[iDecal];
            this._idxBuffer.addNumber(iDecal);
            count++;
        }
        for (let iDecal = 0; iDecal < this.dynamicDecals.length; iDecal++) {
            const decal = this.dynamicDecals[iDecal];
            this._idxBuffer.addNumber(iDecal + this.staticDecals.length);
            count++;
        }
        // this._clusterBuffer.addNumber(start)
        this._clusterBuffer.addNumber(count);
        start = count;
        count = 0;
        for (let iEnv = 0; iEnv < this.envProbes.length; iEnv++) {
            const envProbe = this.envProbes[iEnv];
            this._idxBuffer.addNumber(iEnv);
            count++;
        }
        // this._clusterBuffer.addNumber(start)
        // this._clusterBuffer.addNumber(count)
        start = count;
        // pack envprobe and irrvolume count together
        count = count * 65536;
        for (let iIrr = 0; iIrr < this.irradianceVolumes.length; iIrr++) {
            const irrVol = this.irradianceVolumes[iIrr];
            this._idxBuffer.addNumber(iIrr);
            count++;
        }
        // this._clusterBuffer.addNumber(start)
        this._clusterBuffer.addNumber(count)
        start = count;
        count = 0;
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
        throw new Error("Method not implemented.");
    }

}
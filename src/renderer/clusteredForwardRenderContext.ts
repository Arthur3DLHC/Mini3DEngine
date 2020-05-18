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
import { DirectionalLight } from "../scene/lights/directionalLight.js";
import { DirectionalLightShadow } from "../scene/lights/directionalLightShadow.js";

export class ClusteredForwardRenderContext extends RenderContext {
    public constructor() {
        super();

        this._tmpData = new Float32Array(4096);
        this._buffer = new BufferHelper(this._tmpData);

        this._tmpIdxData = new Uint32Array(4096);
        this._idxBuffer = new BufferHelper(this._tmpIdxData);

        this._tmpClusterData = new Uint32Array(ClusteredForwardRenderContext.NUM_CLUSTERS * ClusteredForwardRenderContext.CLUSTER_SIZE_INT);
        this._clusterBuffer = new BufferHelper(this._tmpClusterData);

        this._ubLights = new UniformBuffer("lights");
        this._ubDecals = new UniformBuffer("decals");
        this._ubEnvProbes = new UniformBuffer("envprobes");
        this._ubIrrVolumes = new UniformBuffer("irrVolumes");
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
        this._ubIrrVolumes.build();
        //this._ubFrame.build();
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
    public static readonly ENVPROBE_SIZE_FLOAT = 4;
    public static readonly IRRVOL_SIZE_FLOAT = 24;

    public static readonly NUM_CLUSTERS = 16 * 8 * 24;
    public static readonly CLUSTER_SIZE_INT = 4;

    private setUniformBufferLayouts() {
        const MAX_LIGHTS = 256;
        const MAX_DECALS = 512;
        const MAX_ENVPROBES = 512;
        const MAX_IRRVOLUMES = 512;
        const MAX_ITEMS = 4096;
        const NUM_CLUSTERS = 16 * 8 * 24;
        const MAX_BONES = 256;
        // per scene

        // TODO: 带结构和数组的 uniform buffer 怎么初始化和更新值？
        // 数组长度 * 对齐后的结构浮点数个数
        this._ubLights.addUniform("lights", MAX_LIGHTS * ClusteredForwardRenderContext.LIGHT_SIZE_FLOAT);
        this._ubDecals.addUniform("decals", MAX_DECALS * ClusteredForwardRenderContext.DECAL_SIZE_FLOAT);
        this._ubEnvProbes.addUniform("probes", MAX_ENVPROBES * ClusteredForwardRenderContext.ENVPROBE_SIZE_FLOAT);
        this._ubIrrVolumes.addUniform("volumes", MAX_IRRVOLUMES * ClusteredForwardRenderContext.IRRVOL_SIZE_FLOAT);

        // per frame,
        // it's too small and webgl does not allow small uniform buffers,
        // so put the time into per view buffer
        //this._ubFrame.addFloat("time", 0);

        // per view,
        const matIdentity = mat4.identity;
        this._ubView.addMat4("matView", matIdentity);
        this._ubView.addMat4("matViewPrev", matIdentity);
        this._ubView.addMat4("matProj", matIdentity);
        this._ubView.addMat4("matProjPrev", matIdentity);
        this._ubView.addVec4("viewport", new vec4());
        this._ubView.addVec3("position", new vec3());
        this._ubView.addFloat("time", 0);
        this._ubView.addVec2("zRange", new vec2());
        this._ubView.addVec2("rtSize", new vec2());
        this._ubView.addVec4("farRect", new vec4());

        this._ubItemIndices.addUniform("indices", MAX_ITEMS);

        this._ubClusters.addUniform("clusters", NUM_CLUSTERS * 4);

        // per obj
        this._ubObject.addMat4("matWorld", matIdentity);
        this._ubObject.addMat4("matWorldPrev", matIdentity);
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
        GLUniformBuffers.uniformBlockNames["View"] = 4;
        GLUniformBuffers.uniformBlockNames["ItemIndices"] = 5;
        GLUniformBuffers.uniformBlockNames["Clusters"] = 6;
        GLUniformBuffers.uniformBlockNames["Object"] = 7;
        GLUniformBuffers.uniformBlockNames["Material"] = 8;
        //GLUniformBuffers.uniformBlockNames["Frame"] = 9;
    }

    private bindUniformBuffers() {
        GLUniformBuffers.bindUniformBuffer(this._ubLights, "Lights");
        GLUniformBuffers.bindUniformBuffer(this._ubDecals, "Decals");
        GLUniformBuffers.bindUniformBuffer(this._ubEnvProbes, "EnvProbes");
        GLUniformBuffers.bindUniformBuffer(this._ubIrrVolumes, "IrrVolumes");
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
        GLUniformBuffers.bindUniformBlock(program, "IrrVolumes");
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
        this._ubDecals.update();

        this._buffer.seek(0);
        for (const probe of this.envProbes) {
            let position = new vec3();
            probe.worldTransform.getTranslation(position);
            this._buffer.addArray(position.values);
            this._buffer.addNumber(probe.textureIndex);
        }
        this._ubEnvProbes.setUniform("probes", this._tmpData, this._buffer.length);
        this._ubEnvProbes.update();

        this._buffer.seek(0);
        for (const vol of this.irradianceVolumes) {
            this._buffer.addArray(vol.worldTransform.values);
            const boxMin = vol.atlasLocation.minPoint.copy();
            const boxMax = vol.atlasLocation.maxPoint.copy();
            this._buffer.addArray(boxMin.values);
            this._buffer.addArray(boxMax.values);
        }
        this._ubIrrVolumes.setUniform("volumes", this._tmpData, this._buffer.length);
        this._ubIrrVolumes.update();
    }

    private addDecalToBuffer(buffer: BufferHelper, decal: Decal) {
        buffer.addArray(decal.worldTransform.values);
        buffer.addArray(decal.atlasRect.values);
    }

    private addLightToBufer(buffer: BufferHelper, light: BaseLight) {
        const lightColor = light.color.copy();

        let radius = 0;
        let outerConeCos = 0;
        let innerConeCos = 0;
        let matShadow: mat4 = new mat4();
        matShadow.setIdentity();
        if (light.type === LightType.Point) {
            radius = (light as PointLight).distance;
        }
        else if (light.type === LightType.Spot) {
            const spot: SpotLight = (light as SpotLight);
            radius = spot.distance;
            outerConeCos = Math.cos(spot.outerConeAngle);
            innerConeCos = Math.cos(spot.innerConeAngle);
            if (light.shadow) {
                let matLightView = light.worldTransform.copy();
                matLightView.inverse();
                let matLightProj = mat4.perspective(spot.outerConeAngle * 2, 1, 0.1, radius);
                mat4.product(matLightProj, matLightView, matShadow);
            }
        }
        else if (light.type === LightType.Directional) {
            if (light.shadow) {
                const dir: DirectionalLight = (light as DirectionalLight);
                const dirShadow: DirectionalLightShadow = (light.shadow as DirectionalLightShadow);
                let matLightView = light.worldTransform.copy();
                matLightView.inverse();
                let matLightProj = mat4.orthographic(-dirShadow.radius, dirShadow.radius, -dirShadow.radius, dirShadow.radius, 0.1, dir.radius);
                mat4.product(matLightProj, matLightView, matShadow);
            }
        }
        if (light.shadow) {
            // NOTE: these matrices is for sample shadow map, not for render shadow map.
            // todo: shadow bias matrix
            let matBias = new mat4();
            matBias.fromTranslation(new vec3([0, 0, light.shadow.bias]));
            // todo: shadowmap atlas rect as viewport matrix
            let w = light.shadow.mapRect.z / light.shadow.mapSize.x;
            let h = light.shadow.mapRect.w / light.shadow.mapSize.y;
            // todo: translation
            let l = light.shadow.mapRect.x;
            let b = light.shadow.mapRect.y;
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
            mat4.product(matBias, matShadow, matShadow);
            mat4.product(matLightViewport, matShadow, matShadow);
        }
        buffer.addArray(lightColor.values);
        buffer.addArray(light.worldTransform.values);
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

    public fillUniformBuffersPerView(camera: Camera) {
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

        const time = 0;
        this._ubView.setFloat("time", 0);

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
        this.fillItemsPerView(camera);
    }

    private fillItemsPerView(camera: Camera) {
        if (this.dynamicLights.length > 0) {
            this._buffer.seek(0);
            for (const light of this.dynamicLights) {
                this.addLightToBufer(this._buffer, light);
            }
            // how to append to the end of the light ubo? or use another ubo?
            // update from the static light count * one light size in ubo
            this._ubLights.updateByData(this._tmpData, this.staticLights.length * ClusteredForwardRenderContext.LIGHT_SIZE_FLOAT * 4, 0, this._buffer.length);
        }
 
        if (this.dynamicDecals.length > 0) {
            this._buffer.seek(0);
            for (const decal of this.dynamicDecals) {
                this.addDecalToBuffer(this._buffer, decal);
            }
            this._ubDecals.updateByData(this._tmpData, this.staticDecals.length * ClusteredForwardRenderContext.DECAL_SIZE_FLOAT * 4, 0, this._buffer.length);
        }
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
                if (light.on) {
                    // todo: cull light against clusters
                    // for test perpurse new, add them all:
                    this._idxBuffer.addNumber(iLight);
                    lightCount++;                    
                }
            }
            for (let iLight = 0; iLight < this.dynamicLights.length; iLight++) {
                const light = this.dynamicLights[iLight];
                if (light.on) {
                    this._idxBuffer.addNumber(iLight + this.staticLights.length);
                    lightCount++;                    
                }
            }
            for (let iDecal = 0; iDecal < this.staticDecals.length; iDecal++) {
                const decal = this.staticDecals[iDecal];
                // todo: check decal distance; cull against clusters
                if (decal.visible) {
                    this._idxBuffer.addNumber(iDecal);
                    decalCount++; 
                }
            }
            for (let iDecal = 0; iDecal < this.dynamicDecals.length; iDecal++) {
                const decal = this.dynamicDecals[iDecal];
                if (decal.visible) {
                    this._idxBuffer.addNumber(iDecal + this.staticDecals.length);
                    decalCount++; 
                }
            }
            for (let iEnv = 0; iEnv < this.envProbes.length; iEnv++) {
                const envProbe = this.envProbes[iEnv];
                if (envProbe.visible) {
                    this._idxBuffer.addNumber(iEnv);
                    envProbeCount++;
                }
            }
            // pack envprobe and irrvolume count together
            for (let iIrr = 0; iIrr < this.irradianceVolumes.length; iIrr++) {
                const irrVol = this.irradianceVolumes[iIrr];
                if (irrVol.visible) {
                    this._idxBuffer.addNumber(iIrr);
                    irrVolCount++; 
                }
            }
            this._clusterBuffer.addNumber(start);       // the start index of this cluster
            this._clusterBuffer.addNumber(lightCount);       // light count
            this._clusterBuffer.addNumber(decalCount);       // decal count
            this._clusterBuffer.addNumber(envProbeCount * 65536 + irrVolCount);        // envprobe (high 2 bytes) and irradiance volume count (low 2 bytes)
            start += lightCount + decalCount + envProbeCount + irrVolCount;
        }

        this._ubItemIndices.updateByData(this._tmpIdxData, 0, 0, this._idxBuffer.length);
        this._ubClusters.updateByData(this._tmpClusterData, 0, 0, this._clusterBuffer.length);
    }

    public fillUniformBuffersPerLightView(light: BaseLight) {

    }

    public fillUniformBuffersPerObject(item: RenderItem) {
        this._ubObject.setMat4("matWorld", item.object.worldTransform);
        this._ubObject.setMat4("matWorldPrev", item.object.worldTransformPrev);
        this._ubObject.setVec4("color", item.object.color);
        this._ubObject.update();

        // todo: object skin transforms, if skinmesh
    }

    public fillUniformBuffersPerObjectByValues(matWorld: mat4, matWorldPrev: mat4, color: vec4) {
        this._ubObject.setMat4("matWorld", matWorld);
        this._ubObject.setMat4("matWorldPrev", matWorldPrev);
        this._ubObject.setVec4("color", color);
        this._ubObject.update();
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
                this._ubMaterialPBR.update();
            }
        }
    }
}
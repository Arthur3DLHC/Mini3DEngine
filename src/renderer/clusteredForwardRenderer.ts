import { Scene } from "../scene/scene.js";
import { RenderList } from "./renderList.js";
import { RenderContext } from "./renderContext.js";
import { Object3D } from "../scene/object3D.js";
import { Camera } from "../scene/cameras/camera.js";
import { BaseLight } from "../scene/lights/baseLight.js";
import { Mesh } from "../scene/mesh.js";
import { Decal } from "../scene/decal.js";
import { IrradianceVolume } from "../scene/irradianceVolume.js";
import { EnvironmentProbe } from "../scene/environmentProbe.js";
import { BlendState } from "../WebGLResources/renderStates/blendState.js";
import { CullState } from "../WebGLResources/renderStates/cullState.js";
import { DepthStencilState } from "../WebGLResources/renderStates/depthStencilState.js";
import { FrameBuffer } from "../WebGLResources/frameBuffer.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { UniformBuffer } from "../WebGLResources/uniformBuffer.js";
import { ShaderProgram } from "../WebGLResources/shaderProgram.js";
import { GLUniformBuffers } from "../WebGLResources/glUnifomBuffers.js";
import { mat4, vec4, vec3, vec2 } from "gl-matrix";

export class ClusteredForwardRenderer {
    public constructor() {
        this._renderListDepthPrepass = new RenderList();
        this._renderListOpaque = new RenderList();
        this._renderListTransparent = new RenderList();
        this._renderListSprites = new RenderList();
        this._tmpRenderList = new RenderList();
        this._renderContext = new RenderContext();

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

        // todo: define uniform buffer layouts
        this.setUniformBufferLayouts();

        // todo: bind to binding points?
        // or just add block name and binding point to glUniformBuffers?
        GLUniformBuffers.uniformBlockNames["Lights"] = 0;
        GLUniformBuffers.uniformBlockNames["Decals"] = 1;
        GLUniformBuffers.uniformBlockNames["EnvProbes"] = 2;
        GLUniformBuffers.uniformBlockNames["IrrVolumes"] = 3
        GLUniformBuffers.uniformBlockNames["Frame"] = 4;
        GLUniformBuffers.uniformBlockNames["View"] = 5;
        GLUniformBuffers.uniformBlockNames["ItemIndices"] = 6;
        GLUniformBuffers.uniformBlockNames["Clusters"] = 7;
        GLUniformBuffers.uniformBlockNames["Object"] = 8;
        GLUniformBuffers.uniformBlockNames["Material"] = 9;

        // todo: import default shader code strings and create shader objects
        this._stdPBRProgram = new ShaderProgram();
        this._colorProgram = new ShaderProgram();
    }

    public render(scene: Scene) {
        this.dispatchObjects(scene);

        // todo: walk through renderlists and render items in them.
        // todo: sort the renderlists first?
    }

    private _renderListDepthPrepass: RenderList;
    private _renderListOpaque: RenderList;
    private _renderListTransparent: RenderList;
    private _renderListSprites: RenderList;
    private _tmpRenderList: RenderList;

    private _renderContext: RenderContext;

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
    
    // default shader programs
    private _stdPBRProgram: ShaderProgram;
    private _colorProgram: ShaderProgram;
    // todo: other programs: depth prepass, shadowmap, occlusion query...

    private setUniformBufferLayouts() {
        // per scene
        const MAX_LIGHTS = 512;
        const MAX_DECALS = 1024;
        const MAX_ENVPROBES = 1024;
        const MAX_IRRVOLUMES = 1024;
        // TODO: 带结构和数组的 uniform buffer 怎么初始化和更新值？
        // 数组长度 * 对齐后的结构浮点数个数
        this._ubLights.addUniform("lights", MAX_LIGHTS * 24);
        this._ubDecals.addUniform("decals", MAX_DECALS * 16);
        this._ubEnvProbes.addUniform("probes", MAX_ENVPROBES * 4);
        this._ubIrrVolumes.addUniform("volumes", MAX_IRRVOLUMES * 20);

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
        this._ubClusters.addUniform("clusters", NUM_CLUSTERS * 8);
        
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

    private dispatchObjects(scene: Scene) {
        this._renderListDepthPrepass.clear();
        this._renderListOpaque.clear();
        this._renderListTransparent.clear();
        this._renderListSprites.clear();
        this._renderContext.clear();

        this.dispatchObject(scene);
    }

    private dispatchObject(object: Object3D) {

        // check visible
        if (object.visible) {
            if (object instanceof Camera) {
                this._renderContext.addCamera(object as Camera);
            } else if (object instanceof BaseLight) {
                this._renderContext.addLight(object as BaseLight);
            } else if (object instanceof Mesh) {
                // nothing to do yet.                
            } else if (object instanceof Decal) {
                this._renderContext.addDecal(object as Decal);
            } else if (object instanceof IrradianceVolume) {
                this._renderContext.addIrradianceVolume(object as IrradianceVolume);
            } else if (object instanceof EnvironmentProbe) {
                this._renderContext.addEnvironmentProbe(object as EnvironmentProbe);
            }
            this._tmpRenderList.clear();
            // 光源等也可能提供 debug 或编辑时用的显示图元
            object.provideRenderItem(this._tmpRenderList);
            // 需要遍历tmpRenderList，根据材质区分最终放到哪个 renderList 里
            // DepthPrepass: 材质没有开启半透明混合和半透明Clip
            // Opaque: 材质没有开启半透明混合
            // Transparent: 材质开启了半透明混合
            for (let index = 0; index < this._tmpRenderList.ItemCount; index++) {
                const item = this._tmpRenderList.getItemAt(index);
                if (item) {
                    if (item.material) {
                        if (item.material.blendState) {
                            if (item.material.blendState.enable) {
                                this._renderListTransparent.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                if (item.material.forceDepthPrepass) {
                                    this._renderListDepthPrepass.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                }
                            } else {
                                this._renderListOpaque.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                this._renderListDepthPrepass.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);

                            }
                        }
                    }
                }
            }
        }

        // iterate children
        for (const child of object.Children) {
            if (child !== null) {
                this.dispatchObject(child);
            }
        }
    }

}
// shader includes
import uniforms_mtl_pbr from "./shaders/shaderIncludes/uniforms_mtl_pbr.glsl.js"
import uniforms_object from "./shaders/shaderIncludes/uniforms_object.glsl.js"
import uniforms_scene from "./shaders/shaderIncludes/uniforms_scene.glsl.js"
import uniforms_view from "./shaders/shaderIncludes/uniforms_view.glsl.js"
import function_transforms from "./shaders/shaderIncludes/function_transforms.glsl.js"
import function_lights from "./shaders/shaderIncludes/function_lights.glsl.js"
import function_shading_pbr from "./shaders/shaderIncludes/function_shading_pbr.glsl.js"
import output_pbr from "./shaders/shaderIncludes/output_pbr.glsl.js"
import output_final from "./shaders/shaderIncludes/output_final.glsl.js"
// shader codes
import single_color_vs from "./shaders/single_color_vs.glsl.js"
import single_color_fs from "./shaders/single_color_fs.glsl.js"
import default_pbr_vs from "./shaders/default_pbr_vs.glsl.js"
import default_pbr_fs from "./shaders/default_pbr_fs.glsl.js"
// modules
import { Scene } from "../scene/scene.js";
import { RenderList } from "./renderList.js";
import { Object3D } from "../scene/object3D.js";
import { Camera } from "../scene/cameras/camera.js";
import { BaseLight } from "../scene/lights/baseLight.js";
import { Mesh } from "../scene/mesh.js";
import { Decal } from "../scene/decal.js";
import { IrradianceVolume } from "../scene/irradianceVolume.js";
import { EnvironmentProbe } from "../scene/environmentProbe.js";
import { ShaderProgram } from "../WebGLResources/shaderProgram.js";
import { GLPrograms } from "../WebGLResources/glPrograms.js";
import { RenderStateSet } from "./renderStateSet.js";
import { RenderStateCache } from "../WebGLResources/renderStateCache.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { Material } from "../scene/materials/material.js"
import { GLRenderStates } from "../WebGLResources/glRenderStates.js"
import { StandardPBRMaterial } from "../scene/materials/standardPBRMaterial.js"
import { ShaderMaterial } from "../scene/materials/shaderMaterial.js"
import { GLTextures } from "../WebGLResources/glTextures.js"
import { TextureAtlas2D } from "../WebGLResources/textures/textureAtlas2D.js"
import { Texture2DArray } from "../WebGLResources/textures/texture2DArray.js"
import { TextureAtlas3D } from "../WebGLResources/textures/textureAtlas3D.js"
import { SamplerUniforms } from "../WebGLResources/samplerUniforms.js"
import { ClusteredForwardRenderContext } from "./clusteredForwardRenderContext.js"

export class ClusteredForwardRenderer {

    public constructor() {
        this._renderListDepthPrepass = new RenderList();
        this._renderListOpaque = new RenderList();
        this._renderListOpaqueOcclusionQuery = new RenderList();
        this._renderListTransparent = new RenderList();
        this._renderListTransparentOcclusionQuery = new RenderList();
        this._renderListSprites = new RenderList();
        this._tmpRenderList = new RenderList();
        this._renderContext = new ClusteredForwardRenderContext();
        this._currentScene = null;
        this._currentObject = null;

        this._renderStatesDepthPrepass = new RenderStateSet();
        this._renderStatesOpaque = new RenderStateSet();
        this._renderStatesOpaqueOcclusion = new RenderStateSet();
        this._renderStatesTransparent = new RenderStateSet();
        this._renderStatesTransparentOcclusion = new RenderStateSet();
        this._curDefaultRenderStates = this._renderStatesDepthPrepass;

        // todo: prepare default renderstates for every phase
        this.createRenderStates();

        this._shadowmapAtlasStaticUnit = 0;
        this._shadowmapAtlasDynamicUnit = 1;
        this._decalAtlasUnit = 2;
        this._envMapArrayUnit = 3;
        this._irradianceVolumeAtlasUnit = 4;

        this._numReservedTextures = 5;

        // todo: 静态shadowmap和动态shadowmap需要分开
        // 在位置不变的光源中，对于场景中的静态部分，起始绘制一张静态shadowmap；
        // 如果它设为可以给动态物体产生阴影，则单将动态物体绘制到另一张动态shadowmap中；
        // 绘制对象时需要同时从这两张 shadowmap 中查询
        // 能否用同一张纹理的两个通道呢？用 colorwritemask 实现分别绘制？
        this._shadowmapAtlasStatic = new TextureAtlas2D();
        this._shadowmapAtlasDynamic = new TextureAtlas2D();

        this._decalAtlas = new TextureAtlas2D();
        this._envMapArray = null;
        this._irradianceVolumeAtlas = new TextureAtlas3D();

        this.registerShaderCodes();

        // todo: import default shader code strings and create shader objects
        this._colorProgram = new ShaderProgram();
        this._colorProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["single_color_vs"]);
        this._colorProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["single_color_fs"]);
        this._colorProgram.build();

        this._stdPBRProgram = new ShaderProgram();
        this._stdPBRProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["default_pbr_vs"]);
        this._stdPBRProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["default_pbr_fs"]);
        this._stdPBRProgram.build();

        // all can use simple color program
        this._depthPrepassProgram = new ShaderProgram();
        this._depthPrepassProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["single_color_vs"]);
        this._depthPrepassProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["single_color_fs"]);
        this._depthPrepassProgram.build();

        this._occlusionQueryProgram = new ShaderProgram();
        this._occlusionQueryProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["single_color_vs"]);
        this._occlusionQueryProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["single_color_fs"]);
        this._occlusionQueryProgram.build();

        this._samplerUniformsStdPBR = new SamplerUniforms(this._stdPBRProgram);

        // todo: bind uniform blocks?
        // bind to a program with all uniform blocks presented?
        // or need to bind to every programs?
        this._renderContext.bindUniformBlocks(this._stdPBRProgram);
    }

    private _renderListDepthPrepass: RenderList;
    private _renderListOpaque: RenderList;
    private _renderListOpaqueOcclusionQuery: RenderList;
    private _renderListTransparent: RenderList;
    private _renderListTransparentOcclusionQuery: RenderList;
    private _renderListSprites: RenderList;
    private _tmpRenderList: RenderList; // object will provide its items to this list first, then dispath to other lists.

    private _renderContext: ClusteredForwardRenderContext;
    private _currentScene: Scene|null;
    /**
     * current object rendering
     */
    private _currentObject: Object3D|null;

    private _renderStatesDepthPrepass: RenderStateSet;
    private _renderStatesOpaque: RenderStateSet;
    private _renderStatesOpaqueOcclusion: RenderStateSet;
    private _renderStatesTransparent: RenderStateSet;
    private _renderStatesTransparentOcclusion: RenderStateSet;
    private _curDefaultRenderStates: RenderStateSet;

    // todo: a unit box geometry for draw bounding boxes; used by occlusion query pass

    public static readonly LIGHT_SIZE_FLOAT = 24;
    public static readonly DECAL_SIZE_FLOAT = 16;
    public static readonly ENVPROBE_SIZE_FLOAT = 4;
    public static readonly IRRVOL_SIZE_FLOAT = 20;

    public static readonly NUM_CLUSTERS = 16 * 8 * 24;
    public static readonly CLUSTER_SIZE_INT = 4;

    // todo: system textures: shadowmap atlas, decal atlas, envMap array, irradiance volumes
    // todo: system texture unit numbers
    private _shadowmapAtlasStaticUnit: GLenum;
    private _shadowmapAtlasDynamicUnit: GLenum;
    private _decalAtlasUnit: GLenum;
    private _envMapArrayUnit: GLenum;
    private _irradianceVolumeAtlasUnit: GLenum;

    private _shadowmapAtlasStatic: TextureAtlas2D;
    private _shadowmapAtlasDynamic: TextureAtlas2D;
    private _decalAtlas: TextureAtlas2D;
    private _envMapArray: Texture2DArray|null;
    private _irradianceVolumeAtlas: TextureAtlas3D;

    private _numReservedTextures: number;
    
    // default shader programs
    // or put them into render phases?
    private _stdPBRProgram: ShaderProgram;
    private _colorProgram: ShaderProgram;
    private _depthPrepassProgram: ShaderProgram;
    private _occlusionQueryProgram: ShaderProgram;
    // todo: other programs: depth prepass, shadowmap, occlusion query...

    // sampler uniforms
    private _samplerUniformsStdPBR: SamplerUniforms | null;
    
    public render(scene: Scene) {

        // if scene changed, setup uniform buffers for scene.
        if (this._currentScene !== scene) {
            // dispatch static objects
            this.dispatchObjects(scene, true);

            this._renderContext.fillUniformBuffersPerScene();
            // todo: generate static light shadowmaps;
            // if light is static, use static shadow or there are no moving dynamic objects in range,
            // use shadow map of last frame;
            // render to texture atlas; if scene changed, need to repack texture atlas.

            this.bindTexturesPerScene();
            // todo: bind texture samplers
            // use some reserved texture units for system textures?
            // shadowmap atlas (static);
            // decal atlas;
            // envProbes;
            // irradiance volumes;
            // GLTextures.setTextureAt(0, )
            this._currentScene = scene;
        }
        // dispatch dynamic objects
        this.dispatchObjects(scene, false);

        // todo: setup uniform buffers per frame, view;
        // per frame data (time) is too small, and was put into per view buffer
        // this._renderContext.fillUniformBuffersPerFrame();

        // fix me: for simplicity, use only one camera; or occlusion query can not work.
        for (let icam = 0; icam < this._renderContext.cameras.length; icam++) {
            const camera = this._renderContext.cameras[icam];
            // set viewport
            if (camera.viewport) {
                GLDevice.gl.viewport(camera.viewport.x, camera.viewport.y, camera.viewport.z, camera.viewport.w);                
            } else {
                GLDevice.gl.viewport(0, 0, GLDevice.canvas.width, GLDevice.canvas.height);
            }
            // todo: camera's clear mode
            GLDevice.clearColor = camera.backgroundColor;
            GLDevice.clearDepth = camera.backgroundDepth;
            GLDevice.clearStencil = camera.backgroundStencil;

            GLDevice.clear(camera.clearColor, camera.clearDepth, camera.clearStencil);

            this._renderContext.fillUniformBuffersPerView(camera);
            this.getOcclusionQueryResults();

            // todo: sort the renderlists first?

            this.renderDepthPrepass();
            this.renderOpaque();
            this.renderTransparent();

            // todo: render sprites
        }
    }

    private createRenderStates() {
        this._renderStatesDepthPrepass.depthState = RenderStateCache.instance.getDepthStencilState(true, true, GLDevice.gl.LEQUAL);
        this._renderStatesDepthPrepass.blendState = RenderStateCache.instance.getBlendState(false, GLDevice.gl.FUNC_ADD, GLDevice.gl.SRC_ALPHA, GLDevice.gl.ONE_MINUS_SRC_ALPHA);
        this._renderStatesDepthPrepass.cullState = RenderStateCache.instance.getCullState(true, GLDevice.gl.BACK);
        this._renderStatesDepthPrepass.colorWriteState = RenderStateCache.instance.getColorWriteState(false, false, false, false);

        this._renderStatesOpaque.depthState = RenderStateCache.instance.getDepthStencilState(true, true, GLDevice.gl.EQUAL);
        this._renderStatesOpaque.blendState = RenderStateCache.instance.getBlendState(false, GLDevice.gl.FUNC_ADD, GLDevice.gl.SRC_ALPHA, GLDevice.gl.ONE_MINUS_SRC_ALPHA);
        this._renderStatesOpaque.cullState = RenderStateCache.instance.getCullState(true, GLDevice.gl.BACK);
        this._renderStatesOpaque.colorWriteState = RenderStateCache.instance.getColorWriteState(true, true, true, true);

        this._renderStatesOpaqueOcclusion.depthState = RenderStateCache.instance.getDepthStencilState(true, false, GLDevice.gl.LESS);
        this._renderStatesOpaqueOcclusion.blendState = RenderStateCache.instance.getBlendState(false, GLDevice.gl.FUNC_ADD, GLDevice.gl.SRC_ALPHA, GLDevice.gl.ONE_MINUS_SRC_ALPHA);
        this._renderStatesOpaqueOcclusion.cullState = RenderStateCache.instance.getCullState(true, GLDevice.gl.BACK);
        this._renderStatesOpaqueOcclusion.colorWriteState = RenderStateCache.instance.getColorWriteState(false, false, false, false);

        this._renderStatesTransparent.depthState = RenderStateCache.instance.getDepthStencilState(true, false, GLDevice.gl.LESS);
        this._renderStatesTransparent.blendState = RenderStateCache.instance.getBlendState(true, GLDevice.gl.FUNC_ADD, GLDevice.gl.SRC_ALPHA, GLDevice.gl.ONE_MINUS_SRC_ALPHA);
        this._renderStatesTransparent.cullState = RenderStateCache.instance.getCullState(false, GLDevice.gl.BACK);
        this._renderStatesTransparent.colorWriteState = RenderStateCache.instance.getColorWriteState(true, true, true, true);

        this._renderStatesTransparentOcclusion.depthState = RenderStateCache.instance.getDepthStencilState(true, false, GLDevice.gl.LESS);
        this._renderStatesTransparentOcclusion.blendState = RenderStateCache.instance.getBlendState(false, GLDevice.gl.FUNC_ADD, GLDevice.gl.SRC_ALPHA, GLDevice.gl.ONE_MINUS_SRC_ALPHA);
        this._renderStatesTransparentOcclusion.cullState = RenderStateCache.instance.getCullState(true, GLDevice.gl.BACK);
        this._renderStatesTransparentOcclusion.colorWriteState = RenderStateCache.instance.getColorWriteState(false, false, false, false);
    }


    private registerShaderCodes() {
        // shader includes
        GLPrograms.shaderCodes["uniforms_mtl_pbr"] = uniforms_mtl_pbr;
        GLPrograms.shaderCodes["uniforms_object"] = uniforms_object;
        GLPrograms.shaderCodes["uniforms_scene"] = uniforms_scene;
        GLPrograms.shaderCodes["uniforms_view"] = uniforms_view;
        GLPrograms.shaderCodes["function_transforms"] = function_transforms;
        GLPrograms.shaderCodes["function_lights"] = function_lights;
        GLPrograms.shaderCodes["function_shading_pbr"] = function_shading_pbr;
        GLPrograms.shaderCodes["output_pbr"] = output_pbr;
        GLPrograms.shaderCodes["output_final"] = output_final;

        // shaders
        GLPrograms.shaderCodes["single_color_vs"] = single_color_vs;
        GLPrograms.shaderCodes["single_color_fs"] = single_color_fs;
        GLPrograms.shaderCodes["default_pbr_vs"] = default_pbr_vs;
        GLPrograms.shaderCodes["default_pbr_fs"] = default_pbr_fs;
    }

    private dispatchObjects(scene: Scene, statics: boolean) {
        this._renderListDepthPrepass.clear();
        this._renderListOpaque.clear();
        this._renderListOpaqueOcclusionQuery.clear();
        this._renderListTransparent.clear();
        this._renderListTransparentOcclusionQuery.clear();
        this._renderListSprites.clear();
        this._renderContext.clear(statics, true);

        this.dispatchObject(scene, statics);
    }

    private dispatchObject(object: Object3D, statics: boolean) {

        // check visible
        if (object.visible) {
            if (object instanceof Camera) {
                const camera = object as Camera;
                camera.updateViewProjTransform();
                this._renderContext.addCamera(camera);
            } else if (object instanceof BaseLight) {
                const light = object as BaseLight;
                if (light.isStatic === statics) {
                    this._renderContext.addLight(light);
                }
            } else if (object instanceof Mesh) {
                // nothing to do yet.                
            } else if (object instanceof Decal) {
                const decal = object as Decal;
                if (decal.isStatic === statics) {
                    this._renderContext.addDecal(decal);
                }
            } else if (object instanceof IrradianceVolume) {
                if (statics) {
                    // irradiance volumes are always static
                    this._renderContext.addIrradianceVolume(object as IrradianceVolume);
                }
            } else if (object instanceof EnvironmentProbe) {
                if (statics) {
                    // environment probes are always static
                    this._renderContext.addEnvironmentProbe(object as EnvironmentProbe);
                }
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
                                if (item.object.occlusionQuery) {
                                    this._renderListTransparentOcclusionQuery.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                } else {
                                    this._renderListTransparent.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                }
                                if (item.material.forceDepthPrepass) {
                                    this._renderListDepthPrepass.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                }
                            } else {
                                if (item.object.occlusionQuery) {
                                    // 如果开了 occlusion query，就不绘制 depth prepass 了？
                                    this._renderListOpaqueOcclusionQuery.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                } else {
                                    this._renderListOpaque.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                    this._renderListDepthPrepass.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                }

                            }
                        }
                    }
                }
            }
        }

        // iterate children
        for (const child of object.children) {
            if (child !== null) {
                this.dispatchObject(child, statics);
            }
        }
    }
    
    private bindTexturesPerScene() {
        GLTextures.setTextureAt(this._shadowmapAtlasStaticUnit, this._shadowmapAtlasStatic.texture);
        GLTextures.setTextureAt(this._shadowmapAtlasDynamicUnit, this._shadowmapAtlasDynamic.texture);
        GLTextures.setTextureAt(this._decalAtlasUnit, this._decalAtlas.texture);
        GLTextures.setTextureAt(this._envMapArrayUnit, this._envMapArray);
        GLTextures.setTextureAt(this._irradianceVolumeAtlasUnit, this._irradianceVolumeAtlas.texture);
    }

    private bindTexturesPerMaterial(material: Material | null) {
        // if pbr mtl
        if (material instanceof StandardPBRMaterial) {
            // todo: need to bind per scene texture units to uniforms too?
            if (this._samplerUniformsStdPBR) {
                this._samplerUniformsStdPBR.setTextureUnit("s_shadowAtlasStatic", this._shadowmapAtlasStaticUnit);
                this._samplerUniformsStdPBR.setTextureUnit("s_shadowAtlasDynamic", this._shadowmapAtlasDynamicUnit);
                this._samplerUniformsStdPBR.setTextureUnit("s_decalAtlas", this._decalAtlasUnit);
                this._samplerUniformsStdPBR.setTextureUnit("s_envMapArray", this._envMapArrayUnit);
                this._samplerUniformsStdPBR.setTextureUnit("s_irrVolAtlas", this._irradianceVolumeAtlasUnit);

                GLTextures.setStartUnit(this._numReservedTextures);
                const pbrMtl = material as StandardPBRMaterial;
                this._samplerUniformsStdPBR.setTexture("s_colorMap", pbrMtl.colorMap);
                this._samplerUniformsStdPBR.setTexture("s_metallicRoughnessMap", pbrMtl.metallicRoughnessMap);
                this._samplerUniformsStdPBR.setTexture("s_emissiveMap", pbrMtl.emissiveMap);
                this._samplerUniformsStdPBR.setTexture("s_normalMap", pbrMtl.normalMap);
                this._samplerUniformsStdPBR.setTexture("s_occlusionMap", pbrMtl.occlusionMap);
            }        
        } else {
            throw new Error("Method not implemented.");
        }
    }

    private getOcclusionQueryResults() {
        // todo: iterate occlusion query objects, get last frame query results by their occlusionID;
        // fix me: query id need to map to camera.
        // throw new Error("Method not implemented.");
    }
    private setRenderStateSet(states: RenderStateSet) {
        this._curDefaultRenderStates = states;
        states.apply();
    }
    private renderDepthPrepass() {
        if (this._renderListDepthPrepass.ItemCount <= 0) {
            return;
        }
        // set render state
        this.setRenderStateSet(this._renderStatesDepthPrepass);
        // use program
        GLPrograms.useProgram(this._depthPrepassProgram);
        this.renderItems(this._renderListDepthPrepass, true);
    }
    private renderOpaque() {
        // non occlusion query objects
        if (this._renderListOpaque.ItemCount > 0) {
            this.setRenderStateSet(this._renderStatesOpaque);
            this.renderItems(this._renderListOpaque, false);
        }

        // occlusion query objects, query for next frame;
        if (this._renderListOpaqueOcclusionQuery.ItemCount > 0) {
            this.setRenderStateSet(this._renderStatesOpaqueOcclusion);
            GLPrograms.useProgram(this._occlusionQueryProgram);
            this.renderItemBoundingBoxes(this._renderListOpaqueOcclusionQuery, true);

            // occlusion query objects, render according to last frame query result
            this.setRenderStateSet(this._renderStatesOpaque);
            this.renderItems(this._renderListOpaqueOcclusionQuery, false, true);
        }
    }
    private renderTransparent() {
        // non occlusion query objects
        if (this._renderListTransparent.ItemCount > 0) {
            this.setRenderStateSet(this._renderStatesTransparent);
            // 半透明物体和不透明物体使用的 Shader 是统一的！
            this.renderItems(this._renderListTransparent);
        }

        // occlusion query objects, query for next frame;
        if (this._renderListTransparentOcclusionQuery.ItemCount > 0) {
            this.setRenderStateSet(this._renderStatesTransparentOcclusion);
            GLPrograms.useProgram(this._occlusionQueryProgram);
            this.renderItemBoundingBoxes(this._renderListTransparentOcclusionQuery, true);

            // occlusion query objects, render according to last frame query result
            this.setRenderStateSet(this._renderStatesTransparent);
            this.renderItems(this._renderListTransparentOcclusionQuery, false, true);
        }
    }
    private renderItems(renderList: RenderList, ignoreMaterial: boolean = false, checkOcclusionResults: boolean = false) {
        for (let i = 0; i < renderList.ItemCount; i++) {
            const item = renderList.getItemAt(i);
            if (item) {
                if (checkOcclusionResults && !item.object.occlusionQueryResult) {
                    continue;
                }
                if (this._currentObject !== item.object) {
                    this._renderContext.fillUniformBuffersPerObject(item);
                }
                if (!ignoreMaterial && item.material) {
                    // todo: set material render states?
                    if(item.material.blendState)GLRenderStates.setBlendState(item.material.blendState);
                    if(item.material.cullState) GLRenderStates.setCullState(item.material.cullState);
                    if(item.material.depthStencilState) GLRenderStates.setDepthStencilState(item.material.depthStencilState);

                    // todo: use program of ShaderMaterial?
                    if (item.material instanceof StandardPBRMaterial) {
                        GLPrograms.useProgram(this._stdPBRProgram);
                    } else if (item.material instanceof ShaderMaterial) {
                        if (item.material.program) {
                            GLPrograms.useProgram(item.material.program);
                        }
                    }
                    this._renderContext.fillUniformBuffersPerMaterial(item.material);
                    this.bindTexturesPerMaterial(item.material);

                    // todo: set sampler index for sampler uniform locations of program
                }
                // draw item geometry
                if (GLPrograms.currProgram) {
                    item.geometry.draw(item.startIndex, item.count, GLPrograms.currProgram.attributes);
                }
                // restore default renderstates for next item.
                this._curDefaultRenderStates.apply();
                this._currentObject = item.object;
            }
        }
    }
    private renderItemBoundingBoxes(renderList: RenderList, occlusionQuery: boolean = false) {
        /*
        // render bounding boxes only, ignore all materials
        // 是每个 object 一个 boundingbox，还是每个 renderitem 一个？
        // 如果 occlusionQuery === true，需要检查对象是否有 queryID，如果没有就创建一个。
        for (let i = 0; i < renderList.ItemCount; i++) {
            const item = renderList.getItemAt(i);
            if (item) {
                if (occlusionQuery) {
                    if (!item.object.occlusionQueryID) {
                        item.object.occlusionQueryID = GLDevice.gl.createQuery();
                    }
                    if (item.object.occlusionQueryID) {
                        GLDevice.gl.beginQuery(GLDevice.gl.ANY_SAMPLES_PASSED, item.object.occlusionQueryID);
                    }
                }
                // todo: draw bounding box
                // get local bouding box of object, then calculate the transform, fill it to the object world transform uniform.
                
                // 是否应该在 object 上记录一个 occlusion query 帧号，如果本帧已经 query 过，就不用再 query 了
                // 因为一个 object 可能会提供多个 renderItem
                if (occlusionQuery) {
                    if (item.object.occlusionQueryID) {
                        GLDevice.gl.endQuery(GLDevice.gl.ANY_SAMPLES_PASSED);
                    }
                }
            }
        }
        */
    }
}
// shader includes
import samplers_scene from "./shaders/shaderIncludes/samplers_scene.glsl.js";
import uniforms_mtl_pbr from "./shaders/shaderIncludes/uniforms_mtl_pbr.glsl.js";
import uniforms_object from "./shaders/shaderIncludes/uniforms_object.glsl.js";
import uniforms_scene from "./shaders/shaderIncludes/uniforms_scene.glsl.js";
import uniforms_view from "./shaders/shaderIncludes/uniforms_view.glsl.js";
import function_cluster from "./shaders/shaderIncludes/function_cluster.glsl.js";
import function_cubemap from "./shaders/shaderIncludes/function_cubemap.glsl.js";
import function_get_items from "./shaders/shaderIncludes/function_get_items.glsl.js";
import function_punctual_lights from "./shaders/shaderIncludes/function_punctual_lights.glsl.js";
import function_shadow from "./shaders/shaderIncludes/function_shadow.glsl.js";
import function_brdf_pbr from "./shaders/shaderIncludes/function_brdf_pbr.glsl.js";
import function_transforms from "./shaders/shaderIncludes/function_transforms.glsl.js";
import output_pbr from "./shaders/shaderIncludes/output_pbr.glsl.js";
import output_final from "./shaders/shaderIncludes/output_final.glsl.js";
// shader codes
import shadowmap_vs from "./shaders/shadowmap_vs.glsl.js";
import shadowmap_fs from "./shaders/shadowmap_fs.glsl.js";
import single_color_vs from "./shaders/single_color_vs.glsl.js";
import single_color_fs from "./shaders/single_color_fs.glsl.js";
import screen_rect_vs from "./shaders/screen_Rect_vs.glsl.js";
import screen_rect_fs from "./shaders/screen_rect_fs.glsl.js";
import default_pbr_vs from "./shaders/default_pbr_vs.glsl.js";
import default_pbr_fs from "./shaders/default_pbr_fs.glsl.js";
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
import { PlaneGeometry } from "../geometry/common/planeGeometry.js"
import vec4 from "../../lib/tsm/vec4.js"
import { Texture2D } from "../WebGLResources/textures/texture2D.js"
import mat4 from "../../lib/tsm/mat4.js"
import { FrameBuffer } from "../WebGLResources/frameBuffer.js"
import { Texture } from "../WebGLResources/textures/texture.js"
import { Frustum } from "../math/frustum.js"
import { ShadowmapAtlas } from "./shadowmapAtlas.js";
import { BoundingSphere } from "../math/boundingSphere.js";
import { LightShadow } from "../scene/lights/lightShadow.js";
import { PointLight } from "../scene/lights/pointLight.js";
import { DirectionalLight } from "../scene/lights/directionalLight.js";
import { SpotLight } from "../scene/lights/spotLight.js";
import { BoundingBox } from "../math/boundingBox.js";
import vec3 from "../../lib/tsm/vec3.js";
import { DirectionalLightShadow } from "../scene/lights/directionalLightShadow.js";
import { TextureCube } from "../WebGLResources/textures/textureCube.js";
import { SamplerState } from "../WebGLResources/renderStates/samplerState.js";
import { CubemapProcessor } from "./cubemapProcessor.js";

export class ClusteredForwardRenderer {

    public constructor() {
        this._drawDebugTexture = true;
        const gl = GLDevice.gl;
        gl.enable(gl.SCISSOR_TEST);

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
        this._objectsMoved = [];
        this._curNumMovedObjects = 0;
        this._visibleLights = [];
        this._curNumVisibleLights = 0;

        this._renderStatesShadow = new RenderStateSet();
        this._renderStatesDepthPrepass = new RenderStateSet();
        this._renderStatesOpaque = new RenderStateSet();
        this._renderStatesOpaqueOcclusion = new RenderStateSet();
        this._renderStatesTransparent = new RenderStateSet();
        this._renderStatesTransparentOcclusion = new RenderStateSet();
        this._renderStatesScrRectOpaque = new RenderStateSet();
        this._renderStatesScrRectTransparent = new RenderStateSet();

        this._curDefaultRenderStates = null;

        // todo: prepare default renderstates for every phase
        this.createRenderStates();

        // builtin geometries
        this._rectGeom = new PlaneGeometry(2, 2, 1, 1);
        this._rectTransform = new mat4();

        this._shadowmapAtlasUnit = 1;
        this._decalAtlasUnit = 2;
        this._envMapArrayUnit = 3;
        this._irradianceVolumeAtlasUnit = 4;

        this._numReservedTextures = 5;


        // todo: 静态shadowmap和动态shadowmap需要分开
        // 在位置不变的光源中，对于场景中的静态部分，起始绘制一张静态shadowmap；
        // 如果它设为可以给动态物体产生阴影，则单将动态物体绘制到另一张动态shadowmap中；
        // 绘制对象时需要同时从这两张 shadowmap 中查询
        // 能否用同一张纹理的两个通道呢？用 colorwritemask 实现分别绘制？
        this._shadowmapAtlasCache = new ShadowmapAtlas();
        this._shadowmapAtlasCache.texture = new Texture2D();
        this._shadowmapAtlasCache.texture.width = 4096;
        this._shadowmapAtlasCache.texture.height = 4096;
        // this._shadowmapAtlasDynamic.texture.width = GLDevice.canvas.width;
        // this._shadowmapAtlasDynamic.texture.height = GLDevice.canvas.height;
        this._shadowmapAtlasCache.texture.depth = 1;
        // this._shadowmapAtlasDynamic.texture.isShadowMap = true;
        this._shadowmapAtlasCache.texture.isShadowMap = true; // debug draw
        this._shadowmapAtlasCache.texture.format = gl.DEPTH_STENCIL;
        this._shadowmapAtlasCache.texture.componentType = gl.UNSIGNED_INT_24_8;
        // debug draw:
        // this._shadowmapAtlasDynamic.texture.format = gl.RGBA;
        // this._shadowmapAtlasDynamic.texture.componentType = gl.UNSIGNED_BYTE;
        this._shadowmapAtlasCache.texture.create();


        this._shadowmapAtlas = new ShadowmapAtlas();
        // todo: create atlas texture
        this._shadowmapAtlas.texture = new Texture2D();
        this._shadowmapAtlas.texture.width = 4096;
        this._shadowmapAtlas.texture.height = 4096;
        // this._shadowmapAtlasDynamic.texture.width = GLDevice.canvas.width;
        // this._shadowmapAtlasDynamic.texture.height = GLDevice.canvas.height;
        this._shadowmapAtlas.texture.depth = 1;
        // this._shadowmapAtlasDynamic.texture.isShadowMap = true;
        this._shadowmapAtlas.texture.isShadowMap = true; // debug draw
        this._shadowmapAtlas.texture.format = gl.DEPTH_STENCIL;
        this._shadowmapAtlas.texture.componentType = gl.UNSIGNED_INT_24_8;
        // debug draw:
        // this._shadowmapAtlasDynamic.texture.format = gl.RGBA;
        // this._shadowmapAtlasDynamic.texture.componentType = gl.UNSIGNED_BYTE;
        this._shadowmapAtlas.texture.create();

        this._decalAtlas = new TextureAtlas2D();

        // todo: should put sizes in a config object parameter?
        this._envMapArray = new Texture2DArray();
        this._envMapArray.width = this._renderContext.envmapSize * 6;
        this._envMapArray.height = this._renderContext.envmapSize;
        this._envMapArray.depth = ClusteredForwardRenderContext.MAX_ENVPROBES;              // 128 envmaps in whole scene?
        this._envMapArray.format = gl.RGB;
        this._envMapArray.mipLevels = 1024;
        this._envMapArray.componentType = gl.UNSIGNED_BYTE;
        this._envMapArray.samplerState = new SamplerState(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR_MIPMAP_LINEAR, gl.LINEAR_MIPMAP_LINEAR);
        this._envMapArray.create();

        // this._envMapDepthTexture = new Texture2D();
        // this._envMapDepthTexture.width = this._renderContext.envmapSize * 6;
        // this._envMapDepthTexture.height = this._renderContext.envmapSize;
        // this._envMapDepthTexture.depth = 1;
        // this._envMapDepthTexture.isShadowMap = true;
        // this._envMapDepthTexture.format = gl.DEPTH_COMPONENT;               // NOTE: not DEPTH but DEPTH_COMPONENT !!!!
        // this._envMapDepthTexture.componentType = gl.UNSIGNED_SHORT;         // use a 16 bit depth buffer for env cube

        // this._envMapDepthTexture.create();

        this._irradianceVolumeAtlas = new TextureAtlas3D();

        this._debugDepthTexture = new Texture2D();
        this._debugDepthTexture.width = 4096;
        this._debugDepthTexture.height = 4096;
        // this._debugDepthTexture.width = GLDevice.canvas.width;
        // this._debugDepthTexture.height = GLDevice.canvas.height;
        this._debugDepthTexture.depth = 1;
        this._debugDepthTexture.isShadowMap = false;
        this._debugDepthTexture.format = gl.RGBA;
        this._debugDepthTexture.componentType = gl.UNSIGNED_BYTE;
        this._debugDepthTexture.create();

        this._shadowmapCacheFBO = new FrameBuffer();
        this._shadowmapCacheFBO.depthStencilTexture = this._shadowmapAtlasCache.texture;
        if (this._debugDepthTexture) {
            this._shadowmapCacheFBO.setTexture(0, this._debugDepthTexture);
        }
        this._shadowmapCacheFBO.prepare();

        this._shadowmapFBO = new FrameBuffer();
        // shadowmaps only need depthstencil
        this._shadowmapFBO.depthStencilTexture = this._shadowmapAtlas.texture;
        // debug draw:
        if (this._drawDebugTexture) {
            // this._shadowmapFBODynamic.setTexture(0, this._debugDepthTexture);
        }
        this._shadowmapFBO.prepare();

        // envmap texture array and FBO
        // this._envmapFBO = new FrameBuffer();
        // this._envmapFBO.setTexture(0, this._envMapArray, 0, 0);
        // this._envmapFBO.depthStencilTexture = this._envMapDepthTexture;
        // this._envmapFBO.prepare();

        this.registerShaderCodes();

        // todo: import default shader code strings and create shader objects
        this._colorProgram = new ShaderProgram();
        this._colorProgram.name = "single_color";
        this._colorProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["single_color_vs"]);
        this._colorProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["single_color_fs"]);
        this._colorProgram.build();

        this._stdPBRProgram = new ShaderProgram();
        this._stdPBRProgram.name = "default_pbr";
        this._stdPBRProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["default_pbr_vs"]);
        this._stdPBRProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["default_pbr_fs"]);
        this._stdPBRProgram.build();

        this._shadowProgram = new ShaderProgram();
        this._shadowProgram.name = "shadow";
        this._shadowProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["shadowmap_vs"]);
        this._shadowProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["shadowmap_fs"]);
        this._shadowProgram.build();

        // all can use simple color program
        this._depthPrepassProgram = new ShaderProgram();
        this._depthPrepassProgram.name = "depth_prepass";
        this._depthPrepassProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["single_color_vs"]);
        this._depthPrepassProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["single_color_fs"]);
        this._depthPrepassProgram.build();

        this._occlusionQueryProgram = new ShaderProgram();
        this._occlusionQueryProgram.name = "occlusion_query";
        this._occlusionQueryProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["single_color_vs"]);
        this._occlusionQueryProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["single_color_fs"]);
        this._occlusionQueryProgram.build();

        this._screenRectProgram = new ShaderProgram();
        this._screenRectProgram.name = "screen_rect";
        this._screenRectProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["screen_rect_vs"]);
        this._screenRectProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["screen_rect_fs"]);
        this._screenRectProgram.build();

        this._samplerUniformsStdPBR = new SamplerUniforms(this._stdPBRProgram);
        this._samplerUniformsScreenRect = new SamplerUniforms(this._screenRectProgram);

        // todo: bind uniform blocks?
        // bind to a program with all uniform blocks presented?
        // or need to bind to every programs?
        this._renderContext.bindUniformBlocks(this._colorProgram);
        this._renderContext.bindUniformBlocks(this._stdPBRProgram);
        this._renderContext.bindUniformBlocks(this._shadowProgram);
        this._renderContext.bindUniformBlocks(this._depthPrepassProgram);
        this._renderContext.bindUniformBlocks(this._occlusionQueryProgram);
        this._renderContext.bindUniformBlocks(this._screenRectProgram);

        this._frustum = new Frustum();


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
    /**
     * moved or animated objects in this frame
     */
    private _objectsMoved: Mesh[];
    private _curNumMovedObjects: number;

    private _visibleLights: BaseLight[];
    private _curNumVisibleLights: number;

    private _renderStatesShadow: RenderStateSet;
    private _renderStatesDepthPrepass: RenderStateSet;
    private _renderStatesOpaque: RenderStateSet;
    private _renderStatesOpaqueOcclusion: RenderStateSet;
    private _renderStatesTransparent: RenderStateSet;
    private _renderStatesTransparentOcclusion: RenderStateSet;
    private _renderStatesScrRectOpaque: RenderStateSet;
    private _renderStatesScrRectTransparent: RenderStateSet;

    private _curDefaultRenderStates: RenderStateSet | null;

    // a geometry to render screen space rectangles?
    private _rectGeom: PlaneGeometry;
    private _rectTransform: mat4;
    // todo: a unit box geometry for draw bounding boxes; used by occlusion query pass

    // todo: system textures: shadowmap atlas, decal atlas, envMap array, irradiance volumes
    // todo: system texture unit numbers
    // private _shadowmapAtlasStaticUnit: GLenum;
    private _shadowmapAtlasUnit: GLenum;
    private _decalAtlasUnit: GLenum;
    private _envMapArrayUnit: GLenum;
    private _irradianceVolumeAtlasUnit: GLenum;

    private _shadowmapAtlasCache: ShadowmapAtlas;  // static objects only
    private _shadowmapAtlas: ShadowmapAtlas; // dynamic objects only
    private _decalAtlas: TextureAtlas2D;
    private _envMapArray: Texture2DArray;
    // private _envMapDepthTexture: Texture2D;
    private _irradianceVolumeAtlas: TextureAtlas3D;

    // FOBs
    private _shadowmapCacheFBO: FrameBuffer;
    private _shadowmapFBO: FrameBuffer;
    private _debugDepthTexture: Texture2D;        // debug use
    private _drawDebugTexture: boolean;
    // private _envmapFBO: FrameBuffer;

    private _numReservedTextures: number;
    public get numReservedTextures(): number {
        return this._numReservedTextures;
    }
    
    // default shader programs
    // or put them into render phases?
    private _stdPBRProgram: ShaderProgram;
    private _colorProgram: ShaderProgram;
    private _shadowProgram: ShaderProgram;
    private _depthPrepassProgram: ShaderProgram;
    private _occlusionQueryProgram: ShaderProgram;
    private _screenRectProgram: ShaderProgram;

    // sampler uniforms
    private _samplerUniformsStdPBR: SamplerUniforms | null;
    private _samplerUniformsScreenRect: SamplerUniforms | null;

    private _frustum: Frustum;

    private createRenderStates() {
        const gl = GLDevice.gl;
        this._renderStatesShadow.depthState = RenderStateCache.instance.getDepthStencilState(true, true, gl.LEQUAL);
        this._renderStatesShadow.blendState = RenderStateCache.instance.getBlendState(false, gl.FUNC_ADD, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this._renderStatesShadow.cullState = RenderStateCache.instance.getCullState(true, gl.BACK);
        if (this._drawDebugTexture) {
            this._renderStatesShadow.colorWriteState = RenderStateCache.instance.getColorWriteState(true, true, true, true);
        } else {
            this._renderStatesShadow.colorWriteState = RenderStateCache.instance.getColorWriteState(false, false, false, false);
        }

        this._renderStatesDepthPrepass.depthState = RenderStateCache.instance.getDepthStencilState(true, true, gl.LEQUAL);
        this._renderStatesDepthPrepass.blendState = RenderStateCache.instance.getBlendState(false, gl.FUNC_ADD, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this._renderStatesDepthPrepass.cullState = RenderStateCache.instance.getCullState(true, gl.BACK);
        this._renderStatesDepthPrepass.colorWriteState = RenderStateCache.instance.getColorWriteState(false, false, false, false);
        // debug show depth prepass output
        // this._renderStatesDepthPrepass.colorWriteState = RenderStateCache.instance.getColorWriteState(true, true, true, true);

        this._renderStatesOpaque.depthState = RenderStateCache.instance.getDepthStencilState(true, true, gl.LEQUAL);
        this._renderStatesOpaque.blendState = RenderStateCache.instance.getBlendState(false, gl.FUNC_ADD, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this._renderStatesOpaque.cullState = RenderStateCache.instance.getCullState(true, gl.BACK);
        this._renderStatesOpaque.colorWriteState = RenderStateCache.instance.getColorWriteState(true, true, true, true);

        this._renderStatesOpaqueOcclusion.depthState = RenderStateCache.instance.getDepthStencilState(true, false, gl.LESS);
        this._renderStatesOpaqueOcclusion.blendState = RenderStateCache.instance.getBlendState(false, gl.FUNC_ADD, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this._renderStatesOpaqueOcclusion.cullState = RenderStateCache.instance.getCullState(true, gl.BACK);
        this._renderStatesOpaqueOcclusion.colorWriteState = RenderStateCache.instance.getColorWriteState(false, false, false, false);

        this._renderStatesTransparent.depthState = RenderStateCache.instance.getDepthStencilState(true, false, gl.LESS);
        this._renderStatesTransparent.blendState = RenderStateCache.instance.getBlendState(true, gl.FUNC_ADD, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this._renderStatesTransparent.cullState = RenderStateCache.instance.getCullState(false, gl.BACK);
        this._renderStatesTransparent.colorWriteState = RenderStateCache.instance.getColorWriteState(true, true, true, true);

        this._renderStatesTransparentOcclusion.depthState = RenderStateCache.instance.getDepthStencilState(true, false, gl.LESS);
        this._renderStatesTransparentOcclusion.blendState = RenderStateCache.instance.getBlendState(false, gl.FUNC_ADD, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this._renderStatesTransparentOcclusion.cullState = RenderStateCache.instance.getCullState(true, gl.BACK);
        this._renderStatesTransparentOcclusion.colorWriteState = RenderStateCache.instance.getColorWriteState(false, false, false, false);

        this._renderStatesScrRectOpaque.depthState = RenderStateCache.instance.getDepthStencilState(false, false, gl.ALWAYS);
        this._renderStatesScrRectOpaque.blendState = RenderStateCache.instance.getBlendState(false, gl.FUNC_ADD, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this._renderStatesScrRectOpaque.cullState = RenderStateCache.instance.getCullState(false, gl.BACK);
        this._renderStatesScrRectOpaque.colorWriteState = RenderStateCache.instance.getColorWriteState(true, true, true, true);
    
        this._renderStatesScrRectTransparent.depthState = RenderStateCache.instance.getDepthStencilState(false, false, gl.ALWAYS);
        this._renderStatesScrRectTransparent.blendState = RenderStateCache.instance.getBlendState(true, gl.FUNC_ADD, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this._renderStatesScrRectTransparent.cullState = RenderStateCache.instance.getCullState(false, gl.BACK);
        this._renderStatesScrRectTransparent.colorWriteState = RenderStateCache.instance.getColorWriteState(true, true, true, true);
    }


    private registerShaderCodes() {
        // shader includes
        GLPrograms.shaderCodes["samplers_scene"] = samplers_scene;
        GLPrograms.shaderCodes["uniforms_mtl_pbr"] = uniforms_mtl_pbr;
        GLPrograms.shaderCodes["uniforms_object"] = uniforms_object;
        GLPrograms.shaderCodes["uniforms_scene"] = uniforms_scene;
        GLPrograms.shaderCodes["uniforms_view"] = uniforms_view;

        GLPrograms.shaderCodes["function_cluster"] = function_cluster;
        GLPrograms.shaderCodes["function_cubemap"] = function_cubemap;
        GLPrograms.shaderCodes["function_get_items"] = function_get_items;
        GLPrograms.shaderCodes["function_punctual_lights"] = function_punctual_lights;
        GLPrograms.shaderCodes["function_shadow"] = function_shadow;
        GLPrograms.shaderCodes["function_brdf_pbr"] = function_brdf_pbr;
        GLPrograms.shaderCodes["function_transforms"] = function_transforms;

        GLPrograms.shaderCodes["output_pbr"] = output_pbr;
        GLPrograms.shaderCodes["output_final"] = output_final;

        // shaders
        GLPrograms.shaderCodes["shadowmap_vs"] = shadowmap_vs;
        GLPrograms.shaderCodes["shadowmap_fs"] = shadowmap_fs;
        GLPrograms.shaderCodes["screen_rect_vs"] = screen_rect_vs;
        GLPrograms.shaderCodes["screen_rect_fs"] = screen_rect_fs;
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
        this._curNumMovedObjects = 0;

        this.dispatchObject(scene, statics);
    }

    private dispatchObject(object: Object3D, statics: boolean) {

        // check visible, only for dynamic objects
        if (object.visible || statics) {
            if (object instanceof Camera) {
                const camera = object as Camera;
                camera.updateViewProjTransform();
                this._renderContext.addCamera(camera);
            } else if (object instanceof BaseLight) {
                const light = object as BaseLight;
                if (light.isStatic === statics) {
                    if (light.shadow && light.castShadow) {
                        if (light.shadow.shadowMap === null || light.shadow.mapSizeChanged) {
                            if (light.isStatic) {
                                // todo: alloc shadowmap atlas
                                this._shadowmapAtlasCache.alloc(light.shadow);
                                // light.shadow.shadowMap = this._shadowmapAtlasStatic.texture;
                            } else {
                                // todo: alloc shadowmap atlas
                                this._shadowmapAtlas.alloc(light.shadow);
                                // light.shadow.shadowMap = this._shadowmapAtlasDynamic.texture;
                            }
                        }
                    }
                    this._renderContext.addLight(light);
                }
            } else if (object instanceof Mesh) {
                // check if it has moved or animated
                if (! object.worldTransformPrev.equals(object.worldTransform)) {
                    this._objectsMoved[this._curNumMovedObjects] = object;
                    this._curNumMovedObjects++;
                }
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
        // GLTextures.setTextureAt(this._shadowmapAtlasStaticUnit, this._shadowmapAtlasStatic.texture);
        // GLTextures.setTextureAt(this._shadowmapAtlasDynamicUnit, this._shadowmapAtlasDynamic.texture);
        GLTextures.setTextureAt(this._decalAtlasUnit, this._decalAtlas.texture);
        GLTextures.setTextureAt(this._envMapArrayUnit, this._envMapArray);
        GLTextures.setTextureAt(this._irradianceVolumeAtlasUnit, this._irradianceVolumeAtlas.texture);
    }

    private bindTexturesPerMaterial(material: Material | null) {
        // if pbr mtl
        if (material instanceof StandardPBRMaterial) {
            // todo: need to bind per scene texture units to uniforms too?
            if (this._samplerUniformsStdPBR) {
                // this._samplerUniformsStdPBR.setTextureUnit("s_shadowAtlasStatic", this._shadowmapAtlasStaticUnit);
                this._samplerUniformsStdPBR.setTextureUnit("s_shadowAtlas", this._shadowmapAtlasUnit);
                this._samplerUniformsStdPBR.setTextureUnit("s_decalAtlas", this._decalAtlasUnit);
                this._samplerUniformsStdPBR.setTextureUnit("s_envMapArray", this._envMapArrayUnit);
                this._samplerUniformsStdPBR.setTextureUnit("s_irrVolAtlas", this._irradianceVolumeAtlasUnit);

                GLTextures.setStartUnit(this._numReservedTextures);
                const pbrMtl = material as StandardPBRMaterial;
                this._samplerUniformsStdPBR.setTexture("s_baseColorMap", pbrMtl.colorMap);
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

    
    public render(scene: Scene) {
        const gl = GLDevice.gl;

        // GLTextures.setTextureAt(this._shadowmapAtlasStaticUnit, null);
        GLTextures.setTextureAt(this._shadowmapAtlasUnit, null);

        let shadowmapUpdated = false;

        // if scene changed, setup uniform buffers for scene.
        if (this._currentScene !== scene) {
            // dispatch static objects
            this.dispatchObjects(scene, true);

            this.updateShadowmaps(false);
            shadowmapUpdated = true;


            this._renderContext.fillUniformBuffersPerScene();

            // todo: bind shaddowmaps only, and render cubemaps
            this.updateCubemaps();

            GLDevice.renderTarget = null;

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

        const matViewProj = new mat4();

        // fix me: for simplicity, use only one camera; or occlusion query can not work.
        for (let icam = 0; icam < this._renderContext.cameraCount; icam++) {
            const camera = this._renderContext.cameras[icam];
            // todo: calculate frustum
            mat4.product(camera.projTransform, camera.viewTransform, matViewProj);

            this._frustum.setFromProjectionMatrix(matViewProj);

            // todo: find lights in view then update shadowmaps only for them?
            this.fetchVisibleLights();

            // todo: update light shadowmaps
            // check which light need update
            // frustum culling, distance
            if (!shadowmapUpdated) {
                this.updateShadowmaps(true);
                shadowmapUpdated = true;
            }

            GLDevice.renderTarget = null;

            // GLTextures.setTextureAt(this._shadowmapAtlasStaticUnit, this._shadowmapAtlasCache.texture);
            GLTextures.setTextureAt(this._shadowmapAtlasUnit, this._shadowmapAtlas.texture);

            // Test code: set render target
            // GLDevice.renderTarget = this._shadowmapFBODynamic;

            // set viewport
            if (camera.viewport) {
                gl.viewport(camera.viewport.x, camera.viewport.y, camera.viewport.z, camera.viewport.w);    
                gl.scissor(camera.viewport.x, camera.viewport.y, camera.viewport.z, camera.viewport.w);
            } else {
                gl.viewport(0, 0, GLDevice.canvas.width, GLDevice.canvas.height);
                gl.scissor(0, 0, GLDevice.canvas.width, GLDevice.canvas.height);
            }

            // need to allow color write and depth write
            this.setRenderStateSet(this._renderStatesOpaque);

            // todo: camera's clear mode
            GLDevice.clearColor = camera.backgroundColor;
            GLDevice.clearDepth = camera.backgroundDepth;
            GLDevice.clearStencil = camera.backgroundStencil;

            GLDevice.clear(camera.clearColor, camera.clearDepth, camera.clearStencil);

            this._renderContext.fillUniformBuffersPerView(camera);
            this.getOcclusionQueryResults();

            // todo: sort the renderlists first?

           // gl.colorMask(false, false, false, false);
            //gl.depthFunc(gl.LEQUAL);
            //gl.disable(gl.BLEND);
            this.renderDepthPrepass(this._frustum);
            //gl.colorMask(true, true, true, true);
            this.renderOpaque(this._frustum);
            // this.renderTransparent();

            // todo: render sprites

            // Test code: apply render target texture to a screen space rectangle
            // test drawing a screen space rectangle
            // GLDevice.renderTarget = null;
            if (this._drawDebugTexture) {
                // shadowmap:
                // this.renderScreenRect(0, 0, 256.0 / 1280.0, 256.0 / 720.0, new vec4([1,1,1,1]), this._debugDepthTexture, 1, 0, false);
                
                // envmap:
                // todo: debug outpu diffuse Riemann sum result
                this.renderScreenRect(0, 0, 768.0 / 1280.0, 128.0 / 720.0, new vec4([1,1,1,1]), this._envMapArray, 1, 1, false);
            }
        }
    }

    private renderDepthPrepass(frustum: Frustum) {
        if (this._renderListDepthPrepass.ItemCount <= 0) {
            return;
        }
        // set render state
        this.setRenderStateSet(this._renderStatesDepthPrepass);
        // use program
        GLPrograms.useProgram(this._depthPrepassProgram);
        this.renderItems(this._renderListDepthPrepass, frustum, true);
    }
    private renderOpaque(frustum: Frustum) {
        // non occlusion query objects
        if (this._renderListOpaque.ItemCount > 0) {
            this.setRenderStateSet(this._renderStatesOpaque);
            this.renderItems(this._renderListOpaque, frustum, false);
        }

        // occlusion query objects, query for next frame;
        /*
        if (this._renderListOpaqueOcclusionQuery.ItemCount > 0) {
            this.setRenderStateSet(this._renderStatesOpaqueOcclusion);
            GLPrograms.useProgram(this._occlusionQueryProgram);
            this.renderItemBoundingBoxes(this._renderListOpaqueOcclusionQuery, true);

            // occlusion query objects, render according to last frame query result
            this.setRenderStateSet(this._renderStatesOpaque);
            this.renderItems(this._renderListOpaqueOcclusionQuery, false, true);
        }
        */
    }
    private renderTransparent(frustum: Frustum) {
        // non occlusion query objects
        if (this._renderListTransparent.ItemCount > 0) {
            this.setRenderStateSet(this._renderStatesTransparent);
            // 半透明物体和不透明物体使用的 Shader 是统一的！
            this.renderItems(this._renderListTransparent, frustum);
        }

        // occlusion query objects, query for next frame;
        if (this._renderListTransparentOcclusionQuery.ItemCount > 0) {
            this.setRenderStateSet(this._renderStatesTransparentOcclusion);
            GLPrograms.useProgram(this._occlusionQueryProgram);
            this.renderItemBoundingBoxes(this._renderListTransparentOcclusionQuery, true);

            // occlusion query objects, render according to last frame query result
            this.setRenderStateSet(this._renderStatesTransparent);
            this.renderItems(this._renderListTransparentOcclusionQuery, frustum, false, true);
        }
    }
    private renderItems(renderList: RenderList, frustum: Frustum, ignoreMaterial: boolean = false, checkOcclusionResults: boolean = false, dynamics: boolean = true, statics: boolean = true) {
        
        const sphere = new BoundingSphere();

        for (let i = 0; i < renderList.ItemCount; i++) {
            const item = renderList.getItemAt(i);
            if (item) {
                if (item.object.isStatic) {
                    if (!statics) {
                        continue;
                    }
                } else {
                    if (!dynamics) {
                        continue;
                    }
                }
                
                if (checkOcclusionResults && !item.object.occlusionQueryResult) {
                    continue;
                }

                // todo frustum culling
                item.geometry.boundingSphere.transform(item.object.worldTransform, sphere);
                if (!frustum.intersectsSphere(sphere)) {
                    continue;
                }

                // item may be animated
                //if (this._currentObject !== item.object) {
                    this._renderContext.fillUniformBuffersPerObject(item);
                //}
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
                if (this._curDefaultRenderStates) {
                    this._curDefaultRenderStates.apply();
                }                
                this._currentObject = item.object;
            }
        }
    }

    private renderShadowItems(renderList: RenderList, light: BaseLight, drawStatics: boolean, drawDynamics: boolean, target: FrameBuffer, copyCache: boolean) {
        if (!light.shadow) {
            return;
        }
        const gl = GLDevice.gl;
        const sphere = new BoundingSphere();
        for (let iFrustum = 0; iFrustum < light.shadow.frustums.length; iFrustum++) {
            const frustum = light.shadow.frustums[iFrustum];
            const rect = light.shadow.mapRects[iFrustum];
            let inited = false;
            for (let i = 0; i < renderList.ItemCount; i++) {
                const item = renderList.getItemAt(i);
                if (item && item.object.castShadow) {
                    // check item moved?
                    // todo: check animated? or overwrite moved flag by skinnedMesh class.
                    // fix me: should add a staic flag to object
                    // static objects never move
                    // dynamic objects may move, or not move.
                    if (item.object.isStatic) {
                        if (!drawStatics) {
                            continue;
                        }
                    } else {
                        if (!drawDynamics) {
                            continue;
                        }
                    }

                    // check frustum culling
                    item.geometry.boundingSphere.transform(item.object.worldTransform, sphere);
                    // iterate all frustums

                    if (frustum.intersectsSphere(sphere)) {
                        if (!inited) {
                            GLDevice.renderTarget = target;

                            gl.viewport(rect.x, rect.y, rect.z, rect.w);
                            gl.scissor(rect.x, rect.y, rect.z, rect.w);
                            this.setRenderStateSet(this._renderStatesShadow);

                            if (copyCache && (target !== this._shadowmapCacheFBO)) {
                                this.copyShadowFromCache(light.shadow, iFrustum);
                            }

                            // todo: support light view idx for point light
                            this._renderContext.fillUniformBuffersPerLightView(light, iFrustum);
                            // disable color output

                            if (!copyCache) {
                                GLDevice.clearColor = new vec4([1, 0, 0, 1]);
                                GLDevice.clearDepth = 1.0;
                                GLDevice.clear(true, true, true);
                            }

                            // render opaque objects which can drop shadow
                            GLPrograms.useProgram(this._shadowProgram);
                            inited = true;
                        }

                        this._renderContext.fillUniformBuffersPerObject(item);

                        // draw item geometry
                        if (GLPrograms.currProgram) {
                            item.geometry.draw(item.startIndex, item.count, GLPrograms.currProgram.attributes);
                        }
                        this._currentObject = item.object;
                    }
                }
            }
        }
    }

    private copyShadowFromCache(shadow: LightShadow, rectIdx: number) {
        GLDevice.sourceFBO = this._shadowmapCacheFBO;
        const rect = shadow.mapRects[rectIdx];
        const x0 = rect.x;
        const y0 = rect.y;
        const x1 = rect.x + rect.z;
        const y1 = rect.y + rect.w;
        GLDevice.gl.blitFramebuffer(x0, y0, x1, y1, x0, y0, x1, y1, GLDevice.gl.DEPTH_BUFFER_BIT, GLDevice.gl.NEAREST);
        GLDevice.sourceFBO = null;
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
                        item.object.occlusionQueryID = gl.createQuery();
                    }
                    if (item.object.occlusionQueryID) {
                        gl.beginQuery(gl.ANY_SAMPLES_PASSED, item.object.occlusionQueryID);
                    }
                }
                // todo: draw bounding box
                // get local bouding box of object, then calculate the transform, fill it to the object world transform uniform.
                
                // 是否应该在 object 上记录一个 occlusion query 帧号，如果本帧已经 query 过，就不用再 query 了
                // 因为一个 object 可能会提供多个 renderItem
                if (occlusionQuery) {
                    if (item.object.occlusionQueryID) {
                        gl.endQuery(gl.ANY_SAMPLES_PASSED);
                    }
                }
            }
        }
        */
    }
    /**
     * render a rectangle in screen space
     * @param left left corner in [0,1] space
     * @param bottom bottom corner in [0,1] space
     * @param width width in [0, 1] space
     * @param height height in [0, 1] space
     * @param color 
     * @param texture 
     * @param textureAmount 
     */
    public renderScreenRect(left: number, bottom: number, width: number, height: number, color: vec4, texture: Texture | null = null, textureAmount: number = 0.0, textureLayer: number = 0.0, transparent: boolean = false) {
        // renderstate?
        // opaque or transparent?
        if (transparent) {
            this.setRenderStateSet(this._renderStatesScrRectTransparent);
        } else {
            this.setRenderStateSet(this._renderStatesScrRectOpaque);
        }
        
        // use program
        GLPrograms.useProgram(this._screenRectProgram);
        // transform matrix
        // from 0,1 to -1,1
        const l = left * 2 - 1;
        const b = bottom * 2 - 1;
        // because the vertices are also [-1, 1], so width and height do not need to change
        const w = width;
        const h = height;
        // const transform: mat4 = new mat4([
        //     w,              0,              0,  0,
        //     0,              h,              0,  0,
        //     0,              0,              1,  0,
        //     w + l,          h + b,          0,  1,
        // ]);
        this._rectTransform.init([
            w,              0,              0,  0,
            0,              h,              0,  0,
            0,              0,              1,  0,
            w + l,          h + b,          0,  1,
        ]);
        this._renderContext.fillUniformBuffersPerObjectByValues(this._rectTransform, this._rectTransform, color);

        // set material uniform block and texture
        this._renderContext.ubMaterialPBR.setFloat("colorMapAmount", textureAmount);
        this._renderContext.ubMaterialPBR.update();

        // todo: support preview texture arrays and 3d textures

        // add a flag in shader for different texture types;
        let samplerName = "s_tex2D";
        if (this._screenRectProgram.glProgram !== null && texture !== null) {
            let location = GLDevice.gl.getUniformLocation(this._screenRectProgram.glProgram, "u_texType");
            if (location !== null) {
                let targetType = 0;
                switch(texture.target) {
                    case GLDevice.gl.TEXTURE_2D:
                        targetType = 0;
                        samplerName = "s_tex2D";
                        break;
                    case GLDevice.gl.TEXTURE_2D_ARRAY:
                        targetType = 1;
                        samplerName = "s_tex2DArray";
                        break;
                    case GLDevice.gl.TEXTURE_CUBE_MAP:
                        targetType = 2;
                        samplerName = "s_texCube";
                        break;
                    case GLDevice.gl.TEXTURE_3D:
                        targetType = 3;
                        samplerName = "s_tex3D";
                        break;
                }
                GLDevice.gl.uniform1i(location, targetType);
            }
            location = GLDevice.gl.getUniformLocation(this._screenRectProgram.glProgram, "u_texlayer");
            if (location !== null) {
                GLDevice.gl.uniform1f(location, textureLayer);
            }
        }

        // set uniform sampler
        if (this._samplerUniformsScreenRect) {
            // GLTextures.setStartUnit(this._numReservedTextures);
            GLTextures.setTextureAt(this._numReservedTextures, texture);
            this._samplerUniformsScreenRect.setTextureUnit(samplerName, this._numReservedTextures);
        }

        // draw geometry
        this._rectGeom.draw(0, Infinity, this._screenRectProgram.attributes);

        // 纹理有可能是 render target，所以在这里取消绑定一下？
        if (this._samplerUniformsScreenRect && texture !== null) {
            GLTextures.setTextureAt(this._numReservedTextures, null, texture.target);
        }
    }

    private fetchVisibleLights() {
        this._curNumVisibleLights = 0;
        for (let i = 0; i < this._renderContext.staticLightCount; i++) {
            const light = this._renderContext.staticLights[i];
            if (light.on && this.lightIsInView(light)) {
                this._visibleLights[this._curNumVisibleLights] = light;
                this._curNumVisibleLights++;
            }
        }
        for (let i = 0; i < this._renderContext.dynamicLightCount; i++) {
            const light = this._renderContext.dynamicLights[i];
            if (light.on && this.lightIsInView(light)) {
                this._visibleLights[this._curNumVisibleLights] = light;
                this._curNumVisibleLights++;
            }
        }
    }

    private lightIsInView(light: BaseLight): boolean {
        if (light instanceof DirectionalLight) {
            // if dir light, use object bounding box?
            const dirLight = light as DirectionalLight;
            const dirShadow = dirLight.shadow as DirectionalLightShadow;
            let radius = dirLight.radius;
            if (dirShadow.radius > 0) {
                radius = dirShadow.radius;
            }
            let distance = 20;
            if(dirShadow.distance > 0) distance = dirShadow.distance;
            const box = new BoundingBox(new vec3([-radius, -radius, -distance]),
                                        new vec3([radius, radius, 0]));

            return this._frustum.intersectsTransformedBox(box, light.worldTransform);
        } else if (light instanceof PointLight) {
            // if point light or spot light, use bounding sphere?
            const pointLight = light as PointLight;
            if (light.range <= 0) {
                return true;                
            } else {
                const sphere = new BoundingSphere(light.worldTransform.getTranslation(), light.range);
                return this._frustum.intersectsSphere(sphere);
            }
        } else if (light instanceof SpotLight) {
            const spotLight = light as SpotLight;
            // fix me: use a cone or frustum for light?
            if (light.range <= 0) {
                // todo: check light direction?
                return true;
            } else {
                const sphere = new BoundingSphere(light.worldTransform.getTranslation(), light.range);
                // todo: check cone?
                return this._frustum.intersectsSphere(sphere);
            }
        }
        return false;
    }

    private updateShadowmaps(visibleLightsOnly: boolean) {
        if (visibleLightsOnly) {
            for (let i = 0; i < this._curNumVisibleLights; i++) {
                const light = this._visibleLights[i];
                if (light.shadow && light.castShadow) {
                    this.updateShadowMapFor(light);
                }
            }
        } else {
            // iterate static lights
            for(let i = 0; i < this._renderContext.staticLightCount; i++) {
                const light = this._renderContext.staticLights[i];
                if (light.shadow && light.castShadow) {
                    this.updateShadowMapFor(light);
                }
            }
    
            // iterate dynamic lights
            for( let i = 0; i < this._renderContext.dynamicLightCount; i++) {
                const light = this._renderContext.dynamicLights[i];
                if (light.shadow && light.castShadow) {
                    this.updateShadowMapFor(light);
                }
            }
        }

        GLDevice.renderTarget = null;
    }

    /**
     * todo: should add a mask for dynamic and static objects?
     * @param light 
     */
    private updateShadowMapFor(light: BaseLight) {
        if (light.shadow && light.castShadow && light.on) {

            // todo: cull light outside view frustum
            // use a bounding sphere for light? or use frustum?
            // transform light frustum to NDC space, then cull against AABB?

            // if shadowmap not generated yet, generate

            light.shadow.updateShadowMatrices();
            if (light.shadow.moved) {
                // 如果光源移动或属性变化了，直接向 shadowmapAtlas 中绘制全部静态和动态物体
                this.renderShadowItems(this._renderListOpaque, light, true, true, this._shadowmapFBO, false);
                light.shadow.cached = false;
                light.shadow.moved = false;
            } else {
                // else (light did not move),
                let cacheCopied = false;
                if (!light.shadow.cached) {
                    // todo: render all static meshes to cache
                    this.renderShadowItems(this._renderListOpaque, light, true, false, this._shadowmapCacheFBO, false);
                    light.shadow.cached = true;

                    // copy from cache to shadowmap
                    GLDevice.renderTarget = this._shadowmapFBO;
                    for(let iRect = 0; iRect < light.shadow.mapRects.length; iRect++) {
                        this.copyShadowFromCache(light.shadow, iRect);
                    }
                    cacheCopied = true;
                }

                // check moved meshes, if there is one can cast shadow moving in light view, update dynamic shadowmap
                this.renderShadowItems(this._renderListOpaque, light, false, true, this._shadowmapFBO, !cacheCopied);
            }
        }
    }

    private updateCubemaps() {
        console.log("updating cubemaps...");

        const gl = GLDevice.gl;

        GLTextures.setTextureAt(this._shadowmapAtlasUnit, this._shadowmapAtlas.texture);
        GLTextures.setTextureAt(this._envMapArrayUnit, null, gl.TEXTURE_2D_ARRAY);

        const cubefaceCamera = new Camera();
        // because objects will be transformed to envprobe local space,
        // and the envprobe's radius is represented by its scale transform,
        // so we can use a unique projection frustum with far plane at 1
        cubefaceCamera.projTransform = mat4.perspective(90, 1, 0.01, 1);
        cubefaceCamera.viewport = new vec4([0, 0, this._renderContext.envmapSize, this._renderContext.envmapSize]);
        
        const matWorldToProbe = new mat4();
        const matViewProj = new mat4();

        // use a temp texturearray and fbo to render cubemaps?
        const envMapArray = new Texture2DArray();

        envMapArray.width = this._renderContext.envmapSize * 6;
        envMapArray.height = this._renderContext.envmapSize;
        envMapArray.depth = this._renderContext.envprobeCount;
        envMapArray.mipLevels = 1;
        envMapArray.format = gl.RGB;
        envMapArray.componentType = gl.UNSIGNED_BYTE;
        envMapArray.samplerState = new SamplerState(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
        envMapArray.create();

        const envMapDepthTexture = new Texture2D();
        
        envMapDepthTexture.width = this._renderContext.envmapSize * 6;
        envMapDepthTexture.height = this._renderContext.envmapSize;
        envMapDepthTexture.depth = 1;
        envMapDepthTexture.isShadowMap = true;
        envMapDepthTexture.format = gl.DEPTH_COMPONENT;               // NOTE: not DEPTH but DEPTH_COMPONENT !!!!
        envMapDepthTexture.componentType = gl.UNSIGNED_SHORT;         // use a 16 bit depth buffer for env cube

        envMapDepthTexture.create();

        const envMapFBO = new FrameBuffer();
        envMapFBO.depthStencilTexture = envMapDepthTexture;

        // todo: repeat several times to simulate multiple bounces

        // iterate all envprobes
        for (let ienvprobe = 0; ienvprobe < this._renderContext.envprobeCount; ienvprobe++) {
            const envprobe = this._renderContext.envProbes[ienvprobe];

            envprobe.worldTransform.copy(matWorldToProbe);
            matWorldToProbe.inverse();

            // todo: set the cubemap texture array layer as render target
            envMapFBO.setTexture(0, envMapArray, 0, ienvprobe);
            envMapFBO.prepare();
            // need to force set, or the target will be set to null in prepare() function
            GLDevice.renderTarget = envMapFBO;
            // GLDevice.forceSetRenderTarget(this._envmapFBO);

            // todo: set viewport and scissor, render 6 faces of cubemap
            for(let iface = 0; iface < 6; iface++) {
                const x = iface * this._renderContext.envmapSize;
                const y = 0;
                const width = this._renderContext.envmapSize;
                const height = this._renderContext.envmapSize;
                gl.viewport(x, y, width, height);
                gl.scissor(x, y, width, height);

                // set render state
                this.setRenderStateSet(this._renderStatesOpaque);

                // clear
                GLDevice.clearColor = envprobe.backgroundColor;
                GLDevice.clearDepth = 1.0;
                GLDevice.clear(true, true, false);

                // todo: setup cube face camera properties
                // transform objects to local space of envprobe first
                // then apply cube face view matrix
                const matFaceView = TextureCube.getFaceViewMatrix(iface);
                mat4.product(matFaceView, matWorldToProbe, cubefaceCamera.viewTransform);
                mat4.product(cubefaceCamera.projTransform, cubefaceCamera.viewTransform, matViewProj);
                this._frustum.setFromProjectionMatrix(matViewProj);
                // set uniforms per view
                // will fill all visible lights, decals, envprobes;
                // is that necessary to render decals ? maybe not;
                // todo: if not first time, fill envprobes, and set env texture
                this._renderContext.fillUniformBuffersPerView(cubefaceCamera, true, false, false, false, false);

                // render items in renderlist
                // only render static items; (there should be only static meshes in renderlist now)
                // fix me: is that necessary to use depth prepass and occlusion query?
                // no after effects?
                this.renderItems(this._renderListOpaque, this._frustum, false, false, false, true);
                // is that necessary to render transparent objects? yes, it is...
            }

            // todo: downsample all cubemaps and generate mipmaps
        }

        GLTextures.setTextureAt(this._envMapArrayUnit, null, gl.TEXTURE_2D_ARRAY);

        const cubeProc = new CubemapProcessor();

        cubeProc.processSpecular(envMapArray, this._envMapArray, this._renderContext.envprobeCount, this._numReservedTextures);
        cubeProc.processDiffuse(envMapArray, this._envMapArray, this._renderContext.envprobeCount, this._numReservedTextures);
        // todo: Spherical Harmonic?

        cubeProc.release();

        envMapFBO.release();
        envMapArray.release();
        envMapDepthTexture.release();

        console.log("done.");
    }
}
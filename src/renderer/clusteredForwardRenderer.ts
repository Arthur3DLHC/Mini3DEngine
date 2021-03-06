// shader includes
import attrib_locations from "./shaders/shaderIncludes/attrib_locations.glsl.js";
import samplers_scene from "./shaders/shaderIncludes/samplers_scene.glsl.js";
import uniforms_mtl_pbr from "./shaders/shaderIncludes/uniforms_mtl_pbr.glsl.js";
import uniforms_object from "./shaders/shaderIncludes/uniforms_object.glsl.js";
import uniforms_scene from "./shaders/shaderIncludes/uniforms_scene.glsl.js";
import uniforms_view from "./shaders/shaderIncludes/uniforms_view.glsl.js";
import function_cluster from "./shaders/shaderIncludes/function_cluster.glsl.js";
import function_cubemap from "./shaders/shaderIncludes/function_cubemap.glsl.js";
import function_depth from "./shaders/shaderIncludes/function_depth.glsl.js";
import function_get_items from "./shaders/shaderIncludes/function_get_items.glsl.js";
import function_ibl from "./shaders/shaderIncludes/function_ibl.glsl.js";
import function_instance from "./shaders/shaderIncludes/function_instance.glsl.js";
import function_punctual_lights from "./shaders/shaderIncludes/function_punctual_lights.glsl.js";
import function_shadow from "./shaders/shaderIncludes/function_shadow.glsl.js";
import function_skin from "./shaders/shaderIncludes/function_skin.glsl.js";
import function_subsurface from "./shaders/shaderIncludes/function_subsurface.glsl.js";
import function_tonemap from "./shaders/shaderIncludes/function_tonemap.glsl.js";
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
import skybox_vs from "./shaders/skybox_vs.glsl.js";
import skybox_fs from "./shaders/skybox_fs.glsl.js";
// modules
import { Scene } from "../scene/scene.js";
import { RenderList } from "./renderList.js";
import { Object3D } from "../scene/object3D.js";
import { Camera } from "../scene/cameras/camera.js";
import { BaseLight } from "../scene/lights/baseLight.js";
import { Mesh } from "../scene/mesh.js";
import { Decal } from "../scene/decal.js";
import { EnvironmentProbe, EnvironmentProbeType } from "../scene/environmentProbe.js";
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
import { PostProcessor } from "./postProcessor.js";
import { SubsurfaceProcessor } from "./subsurfaceProcessor.js";
import { BoxGeometry } from "../geometry/common/boxGeometry.js";
import { SkinMesh } from "../scene/skinMesh.js";
import mat3 from "../../lib/tsm/mat3.js";
import { InstancedMesh } from "../mini3DEngine.js";
import { RenderItem } from "./renderItem.js";
import { BoxWireframeGeometry } from "../geometry/common/boxWireframeGeometry.js";
import { SphereWireframeGeometry } from "../geometry/common/sphereWireframeGeometry.js";
import { BoundingRenderModes } from "./boundingRenderModes.js";
import { DebugRenderer } from "./debugRenderer.js";
import { ObjectTagRenderer } from "./objectTagRenderer.js";
import { GPUParticleSystem } from "../scene/gpuParticleSystem.js";
import { SceneTextureUnits } from "./sceneTextureUnits.js";

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
        this._renderListBoundingBox = new RenderList();
        this._renderListBoundingSphere = new RenderList();
        this._renderListSprites = new RenderList();
        this._tmpRenderList = new RenderList();

        this._itemFilterDepthPrepass = new RenderItemFilters();
        this._itemFilterDepthPrepass.ignoreMaterials = true;

        this._itemFilterOpaque = new RenderItemFilters();
        this._itemFilterOpaque.particles = true;

        this._itemFilterOpaqueOcclusionQuery = new RenderItemFilters();
        this._itemFilterOpaqueOcclusionQuery.particles = true;
        this._itemFilterOpaqueOcclusionQuery.checkOcclusionResults = true;

        this._itemFilterTransparent = new RenderItemFilters();
        this._itemFilterTransparent.particles = true;

        this._itemFilterTransparentOcclusionQuery = new RenderItemFilters();
        this._itemFilterTransparentOcclusionQuery.particles = true;
        this._itemFilterTransparentOcclusionQuery.checkOcclusionResults = true;

        this._itemFilterDepthPrepassProbe = new RenderItemFilters();
        this._itemFilterDepthPrepassProbe.ignoreMaterials = true;
        this._itemFilterDepthPrepassProbe.dynamics = false;

        this._itemFilterOpaqueProbe = new RenderItemFilters();
        this._itemFilterOpaqueProbe.dynamics = false;

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

        this._skyboxGeom = new BoxGeometry(2, 2, 2);
        this._skyboxTransform = mat4.identity.copyTo();

        this._occlusionBoxGeom = new BoxGeometry(1, 1, 1);
        this._boundingBoxTransform = mat4.identity.copyTo();

        this._boundingBoxWireframeGeom = new BoxWireframeGeometry(1, 1, 1);
        this._boundingSphereWireframeGeom = new SphereWireframeGeometry(1, 64);

        // main output
        // todo: handle size change

        // can not use RG16F to store the view space normal, because the normal z may be negative near the edge of the view
        // consider use 16 bit integer buffer? because half float only have 10 fraction bits (1024)?
        this._sceneNormalTexture = new Texture2D(GLDevice.canvas.width, GLDevice.canvas.height, 1, 1, gl.RGBA, gl.HALF_FLOAT);
        this._sceneNormalTexture.create();

        this._sceneSpecularRoughnessTexture = new Texture2D(GLDevice.canvas.width, GLDevice.canvas.height, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE);
        this._sceneSpecularRoughnessTexture.create();

        this._sceneDepthTexture = new Texture2D(GLDevice.canvas.width, GLDevice.canvas.height, 1, 1, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8);
        this._sceneDepthTexture.samplerState = new SamplerState(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST, gl.NEAREST);
        this._sceneDepthTexture.create();

        this._sceneColorTexture = [];
        this._mainFBO = [];
        this._postprocessFBO = [];
        for( let i = 0; i < 2; i++) {
            this._sceneColorTexture[i] = new Texture2D(GLDevice.canvas.width, GLDevice.canvas.height, 1, 1, gl.RGBA, gl.HALF_FLOAT);
            this._sceneColorTexture[i].create();

            this._mainFBO[i] = new FrameBuffer();
            this._mainFBO[i].attachTexture(0, this._sceneColorTexture[i]);
            this._mainFBO[i].attachTexture(1, this._sceneNormalTexture);
            this._mainFBO[i].attachTexture(2, this._sceneSpecularRoughnessTexture);
            this._mainFBO[i].depthStencilTexture = this._sceneDepthTexture;
            this._mainFBO[i].prepare();

            this._postprocessFBO[i] = new FrameBuffer();
            this._postprocessFBO[i].attachTexture(0, this._sceneColorTexture[i]);
            this._postprocessFBO[i].prepare();
        }
        this._currFrameFBOIdx = 0;

        this._shadowmapAtlasUnit = SceneTextureUnits.shadowmapAtlas;// 1;
        this._decalAtlasUnit = SceneTextureUnits.decalAtlas;// 2;
        this._envMapArrayUnit = SceneTextureUnits.envMapArray;// 3;
        this._specularDFGUnit = SceneTextureUnits.specularDFG;// 4;
        this._irradianceProbeArrayUnit = SceneTextureUnits.irradianceProbeArray;// 5;

        this._numReservedTextures = SceneTextureUnits.count;//6;


        // todo: 静态shadowmap和动态shadowmap需要分开
        // 在位置不变的光源中，对于场景中的静态部分，起始绘制一张静态shadowmap；
        // 如果它设为可以给动态物体产生阴影，则单将动态物体绘制到另一张动态shadowmap中；
        // 绘制对象时需要同时从这两张 shadowmap 中查询
        // 能否用同一张纹理的两个通道呢？用 colorwritemask 实现分别绘制？
        this._shadowmapAtlasCache = new ShadowmapAtlas();
        this._shadowmapAtlasCache.texture = new Texture2D(4096, 4096, 1, 1, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8, true);
        this._shadowmapAtlasCache.texture.isShadowMap = true; // debug draw
        // debug draw:
        // this._shadowmapAtlasDynamic.texture.format = gl.RGBA;
        // this._shadowmapAtlasDynamic.texture.componentType = gl.UNSIGNED_BYTE;
        this._shadowmapAtlasCache.texture.create();


        this._shadowmapAtlas = new ShadowmapAtlas();
        // todo: create atlas texture
        this._shadowmapAtlas.texture = new Texture2D(4096, 4096, 1, 1, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8, true);
        // debug draw:
        // this._shadowmapAtlasDynamic.texture.format = gl.RGBA;
        // this._shadowmapAtlasDynamic.texture.componentType = gl.UNSIGNED_BYTE;
        this._shadowmapAtlas.texture.create();

        this._decalAtlas = new TextureAtlas2D();

        // todo: should put sizes in a config object parameter?
        // is 16 bit float textures too big?
        // fix me: firefox do not support RGB 16F rendertarget, only RGBA 16F
        // this._envMapArray = new Texture2DArray(this._renderContext.envmapSize * 6, this._renderContext.envmapSize,
        //     ClusteredForwardRenderContext.MAX_ENVPROBES, 1024, gl.RGB, gl.UNSIGNED_BYTE, false);
        this._envMapArray = new Texture2DArray(this._renderContext.envmapSize,// * 6,
            this._renderContext.envmapSize,
            ClusteredForwardRenderContext.MAX_ENVPROBES * 6, 1024, gl.RGBA, gl.HALF_FLOAT, false);
    
        this._envMapArray.samplerState = new SamplerState(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR_MIPMAP_LINEAR, gl.LINEAR);


        // this._envMapDepthTexture = new Texture2D();
        // this._envMapDepthTexture.width = this._renderContext.envmapSize * 6;
        // this._envMapDepthTexture.height = this._renderContext.envmapSize;
        // this._envMapDepthTexture.depth = 1;
        // this._envMapDepthTexture.isShadowMap = true;
        // this._envMapDepthTexture.format = gl.DEPTH_COMPONENT;               // NOTE: not DEPTH but DEPTH_COMPONENT !!!!
        // this._envMapDepthTexture.componentType = gl.UNSIGNED_SHORT;         // use a 16 bit depth buffer for env cube

        // this._envMapDepthTexture.create();

        this._specularDFG = new Texture2D(128, 128, 1, 1, gl.RGB, gl.UNSIGNED_BYTE);
        this._specularDFG.samplerState = new SamplerState(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR);
        this._specularDFG.create();

        this._irradianceProbesArray = new Texture2DArray(1, 1, ClusteredForwardRenderContext.MAX_IRRPROBES * 6, 1, gl.RGBA, gl.HALF_FLOAT, false);
        this._irradianceProbesArray.samplerState = new SamplerState(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST, gl.NEAREST);

        this._debugDepthTexture = new Texture2D(4096, 4096, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, false);
        this._debugDepthTexture.create();

        this._shadowmapCacheFBO = new FrameBuffer();
        this._shadowmapCacheFBO.depthStencilTexture = this._shadowmapAtlasCache.texture;
        if (this._debugDepthTexture) {
            this._shadowmapCacheFBO.attachTexture(0, this._debugDepthTexture);
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

        console.log("building shaders...");

        // todo: import default shader code strings and create shader objects
        // todo: make a string-keyed shader cache?
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

        // this._stdPBRSkinProgram = new ShaderProgram();
        // this._stdPBRSkinProgram.name = "default_pbr_skin";
        // this._stdPBRSkinProgram.vertexShaderCode = GLPrograms.processSourceCode("#define USE_SKINNING 1\n" + GLPrograms.shaderCodes["default_pbr_vs"]);
        // this._stdPBRSkinProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["default_pbr_fs"]);
        // this._stdPBRSkinProgram.build();

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

        this._skyboxProgram = new ShaderProgram();
        this._skyboxProgram.name = "skybox";
        this._skyboxProgram.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["skybox_vs"]);
        this._skyboxProgram.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["skybox_fs"]);
        this._skyboxProgram.build();

        this._samplerUniformsStdPBR = new SamplerUniforms(this._stdPBRProgram);
        //this._samplerUniformsStdPBRSkin = new SamplerUniforms(this._stdPBRSkinProgram);
        this._samplerUniformsScreenRect = new SamplerUniforms(this._screenRectProgram);

        // todo: bind uniform blocks?
        // bind to a program with all uniform blocks presented?
        // or need to bind to every programs?
        this._renderContext.bindUniformBlocks(this._colorProgram);
        this._renderContext.bindUniformBlocks(this._stdPBRProgram);
        //this._renderContext.bindUniformBlocks(this._stdPBRSkinProgram);
        this._renderContext.bindUniformBlocks(this._shadowProgram);
        this._renderContext.bindUniformBlocks(this._depthPrepassProgram);
        this._renderContext.bindUniformBlocks(this._occlusionQueryProgram);
        this._renderContext.bindUniformBlocks(this._screenRectProgram);
        this._renderContext.bindUniformBlocks(this._skyboxProgram);

        this._frustum = new Frustum();

        console.log("creating postprocessor...");

        this._postprocessor = new PostProcessor(this._renderContext,
            this._sceneDepthTexture, this._sceneNormalTexture, this._sceneSpecularRoughnessTexture,
            this._envMapArrayUnit, this._specularDFGUnit);

        // this._postprocessor.ssr.enable = false;
        // this._postprocessor.ssao.enable = false;
        this._postprocessor.ssao.radius = 0.2;

        console.log("creating subsufaceprocessor...");

        this._subsurfProcessor = new SubsurfaceProcessor();

        console.log("creating debugRenderer...");

        this._debugRenderer = new DebugRenderer(this._renderContext, this._sceneDepthTexture);

        console.log("clustered forward renderer created.");

        this._objectTagRenderer = new ObjectTagRenderer();

        if (GPUParticleSystem.defaultMaterial === null) {
            GPUParticleSystem.initDefaultMaterial(this._renderContext);
        }
    }

    private _renderListDepthPrepass: RenderList;
    private _renderListOpaque: RenderList;
    private _renderListOpaqueOcclusionQuery: RenderList;
    private _renderListTransparent: RenderList;
    private _renderListTransparentOcclusionQuery: RenderList;
    private _renderListBoundingBox: RenderList; // objects showing their bouding boxes
    private _renderListBoundingSphere: RenderList; // objects showing their bouding spheres
    private _renderListSprites: RenderList;
    private _tmpRenderList: RenderList; // object will provide its items to this list first, then dispath to other lists.

    private _itemFilterDepthPrepass: RenderItemFilters;
    private _itemFilterOpaque: RenderItemFilters;
    private _itemFilterOpaqueOcclusionQuery: RenderItemFilters;
    private _itemFilterTransparent: RenderItemFilters;
    private _itemFilterTransparentOcclusionQuery: RenderItemFilters;
    private _itemFilterOpaqueProbe: RenderItemFilters;
    private _itemFilterDepthPrepassProbe: RenderItemFilters;

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

    // a geometry to render screen space rectangles
    private _rectGeom: PlaneGeometry;
    private _rectTransform: mat4;

    // a box geometry to render skybox
    private _skyboxGeom: BoxGeometry;
    private _skyboxTransform: mat4;

    // todo: a unit box geometry for draw bounding boxes; used by occlusion query pass
    private _occlusionBoxGeom: BoxGeometry;
    private _boundingBoxTransform: mat4;

    // box and sphere wireframe geometry, for debug showing bounding boxes and spheres.
    private _boundingBoxWireframeGeom: BoxWireframeGeometry;
    private _boundingSphereWireframeGeom: SphereWireframeGeometry;

    // todo: system textures: shadowmap atlas, decal atlas, envMap array, irradiance probes
    // todo: system texture unit numbers
    // private _shadowmapAtlasStaticUnit: GLenum;
    private _shadowmapAtlasUnit: GLenum;
    private _decalAtlasUnit: GLenum;
    private _envMapArrayUnit: GLenum;
    private _specularDFGUnit: GLenum;
    private _irradianceProbeArrayUnit: GLenum;

    private _sceneColorTexture: Texture2D[];      // main color output
    private _sceneNormalTexture: Texture2D;
    private _sceneSpecularRoughnessTexture: Texture2D;
    private _sceneDepthTexture: Texture2D;              // main depth texture
                                                        // todo: use two depth textures and swap between this and last frame,
                                                        // for objects needs depth when rendering, such as particle systems?
                                                        // or render particle systems after all opaque objects has been rendered?

    private _shadowmapAtlasCache: ShadowmapAtlas;  // static objects only
    private _shadowmapAtlas: ShadowmapAtlas; // dynamic objects only
    private _decalAtlas: TextureAtlas2D;
    private _envMapArray: Texture2DArray;
    private _specularDFG: Texture2D;
    // private _envMapDepthTexture: Texture2D;
    private _irradianceProbesArray: Texture2DArray;

    // FBOs

    // todo: Two FBOs, swap between curr frame and prev frame
    private _mainFBO: FrameBuffer[];                 // MRT: color, normal_roughness_specular
    private _postprocessFBO: FrameBuffer[];
    private _currFrameFBOIdx: number;

    private _shadowmapCacheFBO: FrameBuffer;
    private _shadowmapFBO: FrameBuffer;
    private _debugDepthTexture: Texture2D;        // debug use
    private _drawDebugTexture: boolean;
    // todo: output to a main texture fbo for post processing

    // private _envmapFBO: FrameBuffer;

    private _numReservedTextures: number;
    public get numReservedTextures(): number {
        return this._numReservedTextures;
    }
    
    // default shader programs
    // or put them into render phases?
    private _stdPBRProgram: ShaderProgram;
    // private _stdPBRSkinProgram: ShaderProgram;
    private _colorProgram: ShaderProgram;
    private _shadowProgram: ShaderProgram;
    private _depthPrepassProgram: ShaderProgram;
    private _occlusionQueryProgram: ShaderProgram;
    private _screenRectProgram: ShaderProgram;
    private _skyboxProgram: ShaderProgram;

    // sampler uniforms
    private _samplerUniformsStdPBR: SamplerUniforms | null;
    // private _samplerUniformsStdPBRSkin: SamplerUniforms | null;
    private _samplerUniformsScreenRect: SamplerUniforms | null;

    private _frustum: Frustum;

    private _postprocessor: PostProcessor;
    private _subsurfProcessor: SubsurfaceProcessor;
    private _debugRenderer: DebugRenderer;
    private _objectTagRenderer: ObjectTagRenderer;

    public get context(): ClusteredForwardRenderContext { return this._renderContext; }

    public get postprocessor(): PostProcessor { return this._postprocessor; }
    public get debugRenderer(): DebugRenderer { return this._debugRenderer; }
    public get objectTagRenderer(): ObjectTagRenderer { return this._objectTagRenderer; }

    public sortTransparents: boolean = true;
    public useClusters: boolean = true;

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
        this._renderStatesOpaqueOcclusion.cullState = RenderStateCache.instance.getCullState(false, gl.BACK);
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
        GLPrograms.shaderCodes["attrib_locations"] = attrib_locations;
        GLPrograms.shaderCodes["samplers_scene"] = samplers_scene;
        GLPrograms.shaderCodes["uniforms_mtl_pbr"] = uniforms_mtl_pbr;
        GLPrograms.shaderCodes["uniforms_object"] = uniforms_object;
        GLPrograms.shaderCodes["uniforms_scene"] = uniforms_scene;
        GLPrograms.shaderCodes["uniforms_view"] = uniforms_view;

        GLPrograms.shaderCodes["function_cluster"] = function_cluster;
        GLPrograms.shaderCodes["function_cubemap"] = function_cubemap;
        GLPrograms.shaderCodes["function_depth"] = function_depth;
        GLPrograms.shaderCodes["function_get_items"] = function_get_items;
        GLPrograms.shaderCodes["function_ibl"] = function_ibl;
        GLPrograms.shaderCodes["function_instance"] = function_instance;
        GLPrograms.shaderCodes["function_punctual_lights"] = function_punctual_lights;
        GLPrograms.shaderCodes["function_shadow"] = function_shadow;
        GLPrograms.shaderCodes["function_skin"] = function_skin;
        GLPrograms.shaderCodes["function_subsurface"] = function_subsurface;
        GLPrograms.shaderCodes["function_tonemap"] = function_tonemap;
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
        GLPrograms.shaderCodes["skybox_vs"] = skybox_vs;
        GLPrograms.shaderCodes["skybox_fs"] = skybox_fs;
    }

    private dispatchObjects(scene: Scene, statics: boolean) {
        this._renderListDepthPrepass.clear();
        this._renderListOpaque.clear();
        this._renderListOpaqueOcclusionQuery.clear();
        this._renderListTransparent.clear();
        this._renderListTransparentOcclusionQuery.clear();
        this._renderListBoundingBox.clear();
        this._renderListBoundingSphere.clear();
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
                // todo: how to check instanced meshes?
                if (! object.worldTransformPrev.equals(object.worldTransform)) {
                    this._objectsMoved[this._curNumMovedObjects] = object;
                    this._curNumMovedObjects++;
                }
            } else if (object instanceof Decal) {
                const decal = object as Decal;
                if (decal.isStatic === statics) {
                    this._renderContext.addDecal(decal);
                }
            } else if (object instanceof EnvironmentProbe) {
                if (statics) {
                    // environment probes are always static
                    const envProbe = object as EnvironmentProbe;
                    if (envProbe.probeType === EnvironmentProbeType.Reflection) {
                        this._renderContext.addEnvironmentProbe(envProbe);
                    } else {
                        this._renderContext.addIrradianceProbe(envProbe);
                    }
                }
            }/* else if (object instanceof GPUParticleSystem) {
                // particle systems are always not static?
                if (!statics) {
                    // nothing to do?
                }
            }*/
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
                                    // 如果开了 occlusion query，就不绘制 depth prepass 了
                                    this._renderListOpaqueOcclusionQuery.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                } else {
                                    this._renderListOpaque.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                    this._renderListDepthPrepass.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                }
                            }
                        }
                    }

                    // todo: add bouding boxes and spheres here?
                    if (item.object.boundingBoxRenderMode !== BoundingRenderModes.none) {
                        this._renderListBoundingBox.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                    }
                    if (item.object.boundingSphereRenderMode !== BoundingRenderModes.none) {
                        this._renderListBoundingSphere.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
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
        GLTextures.setTextureAt(this._specularDFGUnit, this._specularDFG);
        GLTextures.setTextureAt(this._irradianceProbeArrayUnit, this._irradianceProbesArray);
    }

    /** only handle stdpbr material now */
    private bindTexturesPerMaterial(material: Material | null) {
        if(material === null) return;

        // todo: skinning
        let samplerUniforms = this._samplerUniformsStdPBR;
        // if (useSkin) {
        //     samplerUniforms = this._samplerUniformsStdPBRSkin;
        // }
        
        // if pbr mtl
        if (material instanceof StandardPBRMaterial) {
            // todo: need to bind per scene texture units to uniforms too?
            if (samplerUniforms) {
                // this._samplerUniformsStdPBR.setTextureUnit("s_shadowAtlasStatic", this._shadowmapAtlasStaticUnit);
                samplerUniforms.setTextureUnit("s_shadowAtlas", this._shadowmapAtlasUnit);
                samplerUniforms.setTextureUnit("s_decalAtlas", this._decalAtlasUnit);
                samplerUniforms.setTextureUnit("s_envMapArray", this._envMapArrayUnit);
                samplerUniforms.setTextureUnit("s_specularDFG", this._specularDFGUnit);
                samplerUniforms.setTextureUnit("s_irrProbeArray", this._irradianceProbeArrayUnit);

                GLTextures.setStartUnit(this._numReservedTextures);
                const pbrMtl = material as StandardPBRMaterial;
                samplerUniforms.setTexture("s_baseColorMap", pbrMtl.colorMap);
                samplerUniforms.setTexture("s_metallicRoughnessMap", pbrMtl.metallicRoughnessMap);
                samplerUniforms.setTexture("s_emissiveMap", pbrMtl.emissiveMap);
                samplerUniforms.setTexture("s_normalMap", pbrMtl.normalMap);
                samplerUniforms.setTexture("s_occlusionMap", pbrMtl.occlusionMap);
                if (pbrMtl.subsurface > 0) {
                    samplerUniforms.setTexture("s_subsurfBRDF", this._subsurfProcessor.preIntegratedBRDFTexture);
                }
            }        
        } else {
            // throw new Error("Method not implemented.");
            // if material has scene texture samplers, set them?
        }
    }

    private getOcclusionQueryResults() {
        // todo: iterate occlusion query objects, get last frame query results by their occlusionID;
        // fix me: query id need to map to camera.
        // throw new Error("Method not implemented.");
        const gl = GLDevice.gl;
        if (this._renderListOpaqueOcclusionQuery.ItemCount > 0) {
            for(let i = 0; i < this._renderListOpaqueOcclusionQuery.ItemCount; i++) {
                const item = this._renderListOpaqueOcclusionQuery.getItemAt(i);
                if (item !== null) {
                    if (item.object.occlusionQueryID !== null) {
                        if (gl.getQueryParameter(item.object.occlusionQueryID, gl.QUERY_RESULT_AVAILABLE)) {
                            const result = gl.getQueryParameter(item.object.occlusionQueryID, gl.QUERY_RESULT);
                            if (result !== undefined && result !== null) {
                                item.object.occlusionQueryResult = result;
                            }
                        }
                    }
                }
            }
        }
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
            this.updateIrradianceProbes(scene);
            this.updateReflectProbes(scene);

            GLDevice.renderTarget = this._mainFBO[this._currFrameFBOIdx];

            this.bindTexturesPerScene();
            // todo: bind texture samplers
            // use some reserved texture units for system textures?
            // shadowmap atlas (static);
            // decal atlas;
            // envProbes;
            // irradiance probes;
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

            GLDevice.renderTarget = this._mainFBO[this._currFrameFBOIdx];

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

            this._renderContext.fillUniformBuffersPerView(camera, true, true, true, true, this.useClusters);
            this.getOcclusionQueryResults();

            // todo: sort the renderlists first?
            // sort transparent items only? from far to near; and renderItem.renderOrder;
            if (this.sortTransparents) {
                this._renderListTransparent.sortFarToNear(camera.position);
            }

           // gl.colorMask(false, false, false, false);
            //gl.depthFunc(gl.LEQUAL);
            //gl.disable(gl.BLEND);

            this.renderDepthPrepass(this._frustum);

            //gl.colorMask(true, true, true, true);

            // sky box
            if (scene.background !== null) {
                if (scene.background instanceof TextureCube) {
                    this.renderSkyBox(scene.background, scene.backgroundIntensity, camera.worldTransform.getTranslation());
                }
            }

            this.renderOpaque(this._frustum);

            this._postprocessor.processOpaque(this.numReservedTextures, this._postprocessFBO[this._currFrameFBOIdx], this._sceneColorTexture[1 - this._currFrameFBOIdx], camera);

            // don't forget to restore render target
            GLDevice.renderTarget = this._mainFBO[this._currFrameFBOIdx];

            this.renderTransparent(this._frustum);

            // todo: render sprites

            // todo: draw debug bounding boxes and spheres after all has been rendered?
            this.renderBoundingBoxes();
            this.renderBoundingSpheres();

            // Test code: apply render target texture to a screen space rectangle
            // test drawing a screen space rectangle
            // GLDevice.renderTarget = null;
        }

        // todo: copy scene image to main backbuffer
        // use blitFramebuffer, or draw a full screen rect?
        // or do the tone mapping and bloom here?

        // GLDevice.renderTarget = null;
        // gl.viewport(0, 0, GLDevice.canvas.width, GLDevice.canvas.height);
        // gl.scissor(0, 0, GLDevice.canvas.width, GLDevice.canvas.height);
        // this.renderScreenRect(0, 0, 1, 1, new vec4([1,1,1,1]), this._sceneColorTexture, 1, 0, 0, false);

        // object tag?
        this._objectTagRenderer.renderIfNeeded(this._renderContext, this._sceneNormalTexture, this._sceneDepthTexture, this.numReservedTextures);

        this._postprocessor.processFinal(this.numReservedTextures);

        this._debugRenderer.render(this.numReservedTextures, null);

        if (this._drawDebugTexture) {
            // shadowmap:
            // this.renderScreenRect(0, 0, 512.0 / 1280.0, 512.0 / 720.0, new vec4([1,1,1,1]), this._debugDepthTexture, 1, 0, 0, false);
            
            // envmap:
            // this.renderScreenRect(0, 0, 768.0 / 1280.0, 128.0 / 720.0, new vec4([1,1,1,1]), this._envMapArray, 1, 1, false);
            // debug output diffuse Riemann sum result

            //for(let i = 0; i < 6; i++) {
            //    this.renderScreenRect(128.0 * i / 1280.0, 0, 128.0 / 1280.0, 128.0 / 720.0, new vec4([1,1,1,1]), this._envMapArray, 1, i, 2, false);
            //    this.renderScreenRect(128.0 * i / 1280.0, 0, 128.0 / 1280.0, 128.0 / 720.0, new vec4([1,1,1,1]), this._irradianceProbesArray, 1, i, 0, false);
            //}
            
            // this.renderScreenRect(0, 0, 128.0 / 1280.0, 128.0 / 720.0, new vec4([1,1,1,1]), this._envMapArray, 1, 1, CubemapProcessor.diffuseMipLevel, false);
            // this.renderScreenRect(128.0 / 1280.0, 0, 128.0 / 1280.0, 128.0 / 720.0, new vec4([1,1,1,1]), this._envMapArray, 1, 2, CubemapProcessor.diffuseMipLevel, false);
            
            // todo: debug outpu specular LD parts and DFG parts
            // this.renderScreenRect(0, 0, 768.0 / 1280.0, 128.0 / 720.0, new vec4([1,1,1,1]), this._envMapArray, 1, 1, 4, false);
            // this.renderScreenRect(0, 0, 256.0 / 1280.0, 256.0 / 720.0, new vec4([1,1,1,1]), this._subsurfProcessor.preIntegratedBRDFTexture, 1, 0, 0, false);
        }

        // swap between curr and prev frame
        if (this._currFrameFBOIdx === 0) {
            this._currFrameFBOIdx = 1;
        } else {
            this._currFrameFBOIdx = 0;
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
        this.renderItems(this._renderListDepthPrepass, frustum, this._itemFilterDepthPrepass);
        //this.renderItems(this._renderListDepthPrepass, frustum, true);
    }

    private renderOpaque(frustum: Frustum) {
        // non occlusion query objects
        if (this._renderListOpaque.ItemCount > 0) {
            this.setRenderStateSet(this._renderStatesOpaque);
            this.renderItems(this._renderListOpaque, frustum, this._itemFilterOpaque);
            //this.renderItems(this._renderListOpaque, frustum, false);
        }

        // occlusion query objects
        if (this._renderListOpaqueOcclusionQuery.ItemCount > 0) {
            // query for next frame;
            this.setRenderStateSet(this._renderStatesOpaqueOcclusion);
            GLPrograms.useProgram(this._occlusionQueryProgram);
            this.renderOcclusionBoundingBoxes(this._renderListOpaqueOcclusionQuery);

            // render according to last frame query result
            this.setRenderStateSet(this._renderStatesOpaque);
            this.renderItems(this._renderListOpaqueOcclusionQuery, frustum, this._itemFilterOpaqueOcclusionQuery);
            // this.renderItems(this._renderListOpaqueOcclusionQuery, frustum, false, true);
        }
    }
    private renderTransparent(frustum: Frustum) {
        // non occlusion query objects
        if (this._renderListTransparent.ItemCount > 0) {
            this.setRenderStateSet(this._renderStatesTransparent);
            // 半透明物体和不透明物体使用的 Shader 是统一的！
            this.renderItems(this._renderListTransparent, frustum, this._itemFilterTransparent);
            // this.renderItems(this._renderListTransparent, frustum);
        }

        // occlusion query objects, query for next frame;
        if (this._renderListTransparentOcclusionQuery.ItemCount > 0) {
            this.setRenderStateSet(this._renderStatesTransparentOcclusion);
            GLPrograms.useProgram(this._occlusionQueryProgram);
            this.renderOcclusionBoundingBoxes(this._renderListTransparentOcclusionQuery);

            // occlusion query objects, render according to last frame query result
            this.setRenderStateSet(this._renderStatesTransparent);
            this.renderItems(this._renderListTransparentOcclusionQuery, frustum, this._itemFilterTransparentOcclusionQuery);
            // this.renderItems(this._renderListTransparentOcclusionQuery, frustum, false, true);
        }
    }

    // private renderItems(renderList: RenderList, frustum: Frustum, ignoreMaterial: boolean = false, checkOcclusionResults: boolean = false, dynamics: boolean = true, statics: boolean = true, particles: boolean = false) {
    private renderItems(renderList: RenderList, frustum: Frustum, filters: RenderItemFilters) {
        const sphere = new BoundingSphere();

        const ignoreMaterial = filters.ignoreMaterials;
        const checkOcclusionResults = filters.checkOcclusionResults;
        const dynamics = filters.dynamics;
        const statics = filters.statics;
        const particles = filters.particles;

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

                // frustum culling
                if (item.object instanceof Mesh) {
                    // different meshes has different bounding spheres
                    const mesh = item.object as Mesh;
                    if (!frustum.intersectsSphere(mesh.boundingSphere)) {
                        continue;
                    }
                } else if (item.object instanceof GPUParticleSystem){
                    if (!particles) {
                        continue;
                    }
                    const psys = item.object as GPUParticleSystem;
                    if (!frustum.intersectsSphere(psys.boundingSphere)) {
                        continue;
                    }
                } else {
                    item.geometry.boundingSphere.transform(item.object.worldTransform, sphere);
                    if (!frustum.intersectsSphere(sphere)) {
                        continue;
                    }
                }

                /*
                if (item.object instanceof InstancedMesh) {
                    // fix me: how to cull instances?
                    // use a whole bounding sphere? or axis aligned bounding box?
                } else {
                    item.geometry.boundingSphere.transform(item.object.worldTransform, sphere);
                    if (!frustum.intersectsSphere(sphere)) {
                        continue;
                    }
                }
                */

                // const isSkin = item.object instanceof SkinMesh;

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
                        // if (isSkin) {
                        //     GLPrograms.useProgram(this._stdPBRSkinProgram);
                        // } else {
                            GLPrograms.useProgram(this._stdPBRProgram);
                        //}
                    } else if (item.material instanceof ShaderMaterial) {
                        if (item.material.program) {
                            GLPrograms.useProgram(item.material.program);
                        }
                    }
                    // if particle system material, will not set up here, but later in psys.render() method.

                    this._renderContext.fillUniformBuffersPerMaterial(item.material);
                    this.bindTexturesPerMaterial(item.material);

                    // todo: set sampler index for sampler uniform locations of program
                }
                
                // psys are special
                if (item.object instanceof GPUParticleSystem) {
                    if (!ignoreMaterial) {
                        const psys = item.object as GPUParticleSystem;
                        // todo: update and render psys here?
                        psys.update(this.numReservedTextures);
                        psys.render(this.numReservedTextures);
                    }
                } else { // draw item geometry
                    if (GLPrograms.currProgram) {
                        if (item.object instanceof InstancedMesh) {
                            const instMesh = item.object as InstancedMesh;
                            item.geometry.drawInstances(item.startIndex, item.count, GLPrograms.currProgram.attributes, instMesh.instanceAttributes, instMesh.curInstanceCount);
                        } else { // general mesh objects
                            item.geometry.draw(item.startIndex, item.count, GLPrograms.currProgram.attributes);
                        }
                    }
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
                    // todo: need to consider skinned mesh and instanced mesh
                    if (item.object instanceof Mesh) {
                        // different meshes has different bounding spheres
                        const mesh = item.object as Mesh;
                        if (!frustum.intersectsSphere(mesh.boundingSphere)) {
                            continue;
                        }
                    } else {
                        item.geometry.boundingSphere.transform(item.object.worldTransform, sphere);
                        if (!frustum.intersectsSphere(sphere)) {
                            continue;
                        }
                    }

                    // iterate all frustums

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
                        if (item.object instanceof InstancedMesh) {
                            const instMesh = item.object as InstancedMesh;
                            item.geometry.drawInstances(item.startIndex, item.count, GLPrograms.currProgram.attributes, instMesh.instanceAttributes, instMesh.curInstanceCount);
                        } else {
                            item.geometry.draw(item.startIndex, item.count, GLPrograms.currProgram.attributes);
                        }
                    }
                    this._currentObject = item.object;
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

    private renderOcclusionBoundingBoxes(renderList: RenderList) {
        // render bounding boxes only, ignore all materials
        // 是每个 object 一个 boundingbox，还是每个 renderitem 一个？
        // 如果 occlusionQuery === true，需要检查对象是否有 queryID，如果没有就创建一个。
        if (GLPrograms.currProgram === null) {
            return;
        }
        
        const gl = GLDevice.gl;

        let boxScale = new vec3();
        const boxLocalTranMat = new mat4();
        const boxLocalScaleMat = new mat4();
        for (let i = 0; i < renderList.ItemCount; i++) {
            const item = renderList.getItemAt(i);
            if (item) {
                if (item.object.occlusionQueryID === null) {
                    item.object.occlusionQueryID = gl.createQuery();
                    if(item.object.occlusionQueryID !== null) {
                        gl.beginQuery(gl.ANY_SAMPLES_PASSED, item.object.occlusionQueryID);
                    }
                }
                else {
                    // must wait untill last query is ready
                    if (!gl.getQueryParameter(item.object.occlusionQueryID, gl.QUERY_RESULT_AVAILABLE)) {
                        continue;
                    }

                    gl.beginQuery(gl.ANY_SAMPLES_PASSED, item.object.occlusionQueryID);
                }
                // todo: draw bounding box
                // get local bouding box of object, then calculate the transform, fill it to the object world transform uniform.

                // fix me: instanced mesh bounding box? 
                // draw instanced also?
                // how to apply local scale and translation matrix ? use u_object.matWorld ?

                const boundingBox = item.geometry.boundingBox;
                boxLocalTranMat.fromTranslation(boundingBox.center);

                boundingBox.maxPoint.copyTo(boxScale);
                boxScale.subtract(boundingBox.minPoint);

                boxLocalScaleMat.fromScaling(boxScale);

                mat4.product(boxLocalTranMat, boxLocalScaleMat, this._boundingBoxTransform);

                if (item.object instanceof InstancedMesh) {
                    const instMesh = item.object as InstancedMesh;

                    // let this._boundingBoxTransform only contains local transform of bounding box
                    this._renderContext.fillUniformBuffersPerObjectByValues(this._boundingBoxTransform, this._boundingBoxTransform, vec4.one, item.object.tag, 0, true);
                
                    this._occlusionBoxGeom.drawInstances(0, Infinity, GLPrograms.currProgram.attributes, instMesh.instanceAttributes, instMesh.curInstanceCount);

                } else {
                    mat4.product(item.object.worldTransform, this._boundingBoxTransform, this._boundingBoxTransform);

                    this._renderContext.fillUniformBuffersPerObjectByValues(this._boundingBoxTransform, this._boundingBoxTransform, vec4.one, item.object.tag, 0, false);
                
                    this._occlusionBoxGeom.draw(0, Infinity, GLPrograms.currProgram.attributes);
                }

                // 是否应该在 object 上记录一个 occlusion query 帧号，如果本帧已经 query 过，就不用再 query 了
                // 因为一个 object 可能会提供多个 renderItem
                if (item.object.occlusionQueryID !== null) {
                    gl.endQuery(gl.ANY_SAMPLES_PASSED);
                }
            }
        }
    }

    private renderBoundingBoxes() {
        const renderList = this._renderListBoundingBox;

        if (renderList.ItemCount <= 0) {
            return;
        }
        
        // TODO: Shader and renderstates? set here or outside?
        const gl = GLDevice.gl;

        // use the opaque render state, draw opaque wireframes
        this._renderStatesOpaque.apply();

        // single color
        GLPrograms.useProgram(this._colorProgram);

        if (GLPrograms.currProgram === null) {
            return;
        }

        let boxScale = new vec3();
        const boxLocalTranMat = new mat4();
        const boxLocalScaleMat = new mat4();
        const boxColor = vec4.one.copyTo();

        for (let i = 0; i < renderList.ItemCount; i++) {
            const item = renderList.getItemAt(i);
            if (item) {
                // todo: draw bounding box
                // get local bouding box of object, then calculate the transform, fill it to the object world transform uniform.

                // fix me: instanced mesh bounding box? 
                // draw instanced also?
                // how to apply local scale and translation matrix ? use u_object.matWorld ?

                const boundingBox = item.geometry.boundingBox;
                boxLocalTranMat.fromTranslation(boundingBox.center);

                boundingBox.maxPoint.copyTo(boxScale);
                boxScale.subtract(boundingBox.minPoint);

                boxLocalScaleMat.fromScaling(boxScale);

                mat4.product(boxLocalTranMat, boxLocalScaleMat, this._boundingBoxTransform);

                // todo: set the color according to object's bounding render mode
                this.getBoundingColorFor(item.object, item.object.boundingBoxRenderMode, boxColor);

                if (item.object instanceof InstancedMesh) {
                    const instMesh = item.object as InstancedMesh;

                    // let this._boundingBoxTransform only contains local transform of bounding box
                    this._renderContext.fillUniformBuffersPerObjectByValues(this._boundingBoxTransform, this._boundingBoxTransform, boxColor, item.object.tag, 0, true);
                
                    this._boundingBoxWireframeGeom.drawInstances(0, Infinity, GLPrograms.currProgram.attributes, instMesh.instanceAttributes, instMesh.curInstanceCount);

                } else {
                    mat4.product(item.object.worldTransform, this._boundingBoxTransform, this._boundingBoxTransform);

                    this._renderContext.fillUniformBuffersPerObjectByValues(this._boundingBoxTransform, this._boundingBoxTransform, boxColor, item.object.tag, 0, false);
                
                    this._boundingBoxWireframeGeom.draw(0, Infinity, GLPrograms.currProgram.attributes);
                }
            }
        }
    }

    getBoundingColorFor(object: Object3D, mode: BoundingRenderModes, outColor: vec4) {
        switch(mode) {
            case BoundingRenderModes.normal:
                vec4.one.copyTo(outColor);
                break;
            case BoundingRenderModes.occlusionResult:
                if (object.occlusionQueryResult) {
                    outColor.rgba = [0, 1, 0, 1];
                } else {
                    outColor.rgba = [1, 0, 0, 1];
                }
                break;
            case BoundingRenderModes.collisionResult:
                vec4.one.copyTo(outColor);
                break;
        }
    }

    private renderBoundingSpheres() {
        const renderList = this._renderListBoundingSphere;
        if (renderList.ItemCount <= 0) {
            return;
        }

        const gl = GLDevice.gl;

        // use the opaque render state, draw opaque wireframes
        this._renderStatesOpaque.apply();

        // single color
        GLPrograms.useProgram(this._colorProgram);

        if (GLPrograms.currProgram === null) {
            return;
        }

        let sphereScale = new vec3();
        const sphereLocalTranMat = new mat4();
        const sphereLocalScaleMat = new mat4();

        for (let i = 0; i < renderList.ItemCount; i++) {
            const item = renderList.getItemAt(i);
            if (item) {
                // todo: draw bounding box
                // get local bouding box of object, then calculate the transform, fill it to the object world transform uniform.

                // fix me: instanced mesh bounding box? 
                // draw instanced also?
                // how to apply local scale and translation matrix ? use u_object.matWorld ?
                if (item.object instanceof SkinMesh) {
                    const skinMesh = item.object as SkinMesh;
                    const boundingSphere = skinMesh.boundingSphere;
                    sphereLocalTranMat.fromTranslation(boundingSphere.center);

                    sphereScale.x = boundingSphere.radius;
                    sphereScale.y = boundingSphere.radius;
                    sphereScale.z = boundingSphere.radius;

                    sphereLocalScaleMat.fromScaling(sphereScale);

                    mat4.product(sphereLocalTranMat, sphereLocalScaleMat, this._boundingBoxTransform);

                    this._renderContext.fillUniformBuffersPerObjectByValues(this._boundingBoxTransform, this._boundingBoxTransform, vec4.one, skinMesh.tag, 0, false);
                    this._boundingSphereWireframeGeom.draw(0, Infinity, GLPrograms.currProgram.attributes);
                } else {
                    const boundingSphere = item.geometry.boundingSphere;
                    sphereLocalTranMat.fromTranslation(boundingSphere.center);

                    sphereScale.x = boundingSphere.radius;
                    sphereScale.y = boundingSphere.radius;
                    sphereScale.z = boundingSphere.radius;

                    sphereLocalScaleMat.fromScaling(sphereScale);

                    mat4.product(sphereLocalTranMat, sphereLocalScaleMat, this._boundingBoxTransform);

                    if (item.object instanceof InstancedMesh) {
                        const instMesh = item.object as InstancedMesh;

                        // let this._boundingBoxTransform only contains local transform of bounding sphere
                        this._renderContext.fillUniformBuffersPerObjectByValues(this._boundingBoxTransform, this._boundingBoxTransform, vec4.one, instMesh.tag, 0, true);

                        this._boundingSphereWireframeGeom.drawInstances(0, Infinity, GLPrograms.currProgram.attributes, instMesh.instanceAttributes, instMesh.curInstanceCount);

                    } else {

                        mat4.product(item.object.worldTransform, this._boundingBoxTransform, this._boundingBoxTransform);

                        this._renderContext.fillUniformBuffersPerObjectByValues(this._boundingBoxTransform, this._boundingBoxTransform, vec4.one, item.object.tag, 0, false);

                        this._boundingSphereWireframeGeom.draw(0, Infinity, GLPrograms.currProgram.attributes);
                    }
                }
            }
        }
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
    public renderScreenRect(left: number, bottom: number, width: number, height: number, color: vec4, texture: Texture | null = null,
         textureAmount: number = 0.0, textureLayer: number = 0.0, mipLevel: number = 0.0, transparent: boolean = false) {
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
        this._renderContext.fillUniformBuffersPerObjectByValues(this._rectTransform, this._rectTransform, color, -1, 0, false);

        // set material uniform block and texture
        this._renderContext.ubMaterialPBR.setFloat("colorMapAmount", textureAmount);
        this._renderContext.ubMaterialPBR.update();

        // todo: support preview texture arrays and 3d textures

        // add a flag in shader for different texture types;
        let samplerName = "s_tex2D";
        if (this._screenRectProgram.glProgram !== null && texture !== null) {
            let location = this._screenRectProgram.getUniformLocation("u_texType");
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
            location = this._screenRectProgram.getUniformLocation("u_texlayer");
            if (location !== null) {
                GLDevice.gl.uniform1f(location, textureLayer);
            }
            location = this._screenRectProgram.getUniformLocation("u_texLevel");
            if (location !== null) {
                GLDevice.gl.uniform1f(location, mipLevel);
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

    private renderSkyBox(cubemap: TextureCube, intensity: number, camPos: vec3) {
        // do not do depth test, culling; (same as screen space rect)
        this.setRenderStateSet(this._renderStatesScrRectOpaque);
        GLPrograms.useProgram(this._skyboxProgram);
        // transform matrix - follow camera
        this._skyboxTransform.setTranslation(camPos);

        // todo: check skybox LDR / HDR

        this._renderContext.fillUniformBuffersPerObjectByValues(this._skyboxTransform, this._skyboxTransform,
            new vec4([intensity,intensity,intensity,intensity]), -1, 0, false, cubemap.isHDR ? 1 : 0);

        GLTextures.setTextureAt(this._numReservedTextures, cubemap, GLDevice.gl.TEXTURE_CUBE_MAP);
        let location = this._skyboxProgram.getUniformLocation("s_skybox");
        if (location !== null) {
            GLDevice.gl.uniform1i(location, this._numReservedTextures);
        }

        this._skyboxGeom.draw(0, Infinity, this._skyboxProgram.attributes);

        // unbind texture
        GLTextures.setTextureAt(this._numReservedTextures, null, GLDevice.gl.TEXTURE_CUBE_MAP);
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
            let distance = dirLight.range;
            if(dirShadow.range > 0) distance = dirShadow.range;
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

        GLDevice.renderTarget = this._mainFBO[this._currFrameFBOIdx];
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
                this.renderShadowItems(this._renderListOpaqueOcclusionQuery, light, true, true, this._shadowmapFBO, false);
                light.shadow.cached = false;
                light.shadow.moved = false;
            } else {
                // else (light did not move),
                let cacheCopied = false;
                if (!light.shadow.cached) {
                    // todo: render all static meshes to cache
                    this.renderShadowItems(this._renderListOpaque, light, true, false, this._shadowmapCacheFBO, false);
                    this.renderShadowItems(this._renderListOpaqueOcclusionQuery, light, true, false, this._shadowmapCacheFBO, false);
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
                this.renderShadowItems(this._renderListOpaqueOcclusionQuery, light, false, true, this._shadowmapFBO, !cacheCopied);
            }
        }
    }

    private updateReflectProbes(scene: Scene) {
        if (this._renderContext.envProbeCount <= 0) {
            return;
        }

        console.log("updating cubemaps...");

        // use a temp envmap array first
        // render envprobes, process specular and diffuse part to the envmap array,
        // then assign it as envprobes, for next bounce time.

        if (this._envMapArray.glTexture) {
            this._envMapArray.release();
        }

        const gl = GLDevice.gl;

        GLTextures.setTextureAt(this._shadowmapAtlasUnit, this._shadowmapAtlas.texture);
        GLTextures.setTextureAt(this._envMapArrayUnit, null, gl.TEXTURE_2D_ARRAY);

        // resize envmap array
        this._envMapArray.width = this._renderContext.envmapSize;
        this._envMapArray.height = this._renderContext.envmapSize;
        this._envMapArray.depth = this._renderContext.envProbeCount * 6;
        this._envMapArray.mipLevels = 6;
        this._envMapArray.format = gl.RGBA;
        this._envMapArray.componentType = gl.HALF_FLOAT;
        this._envMapArray.samplerState = new SamplerState(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR_MIPMAP_LINEAR, gl.LINEAR);
        // this._envMapArray.samplerState = new SamplerState(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_NEAREST);

        this._envMapArray.create();

        // use a temp texturearray and fbo to render cubemaps
        const tmpEnvMapArray = new Texture2DArray();

        tmpEnvMapArray.width = this._renderContext.envmapSize;// * 6;
        tmpEnvMapArray.height = this._renderContext.envmapSize;
        tmpEnvMapArray.depth = this._renderContext.envProbeCount * 6;
        tmpEnvMapArray.mipLevels = 1;
        tmpEnvMapArray.format = gl.RGBA;
        tmpEnvMapArray.componentType = gl.HALF_FLOAT;
        tmpEnvMapArray.samplerState = new SamplerState(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
        tmpEnvMapArray.create();

        const cubeProc = new CubemapProcessor();

        // repeat several times to simulate multiple bounces
        // todo: 分开 irradiance probes 之后，这里就不用做多次反弹了
        GLTextures.setTextureAt(this._irradianceProbeArrayUnit, this._irradianceProbesArray, gl.TEXTURE_2D_ARRAY);
        GLTextures.setTextureAt(this._envMapArrayUnit, null, gl.TEXTURE_2D_ARRAY);

        const probeCount = this._renderContext.envProbeCount;
        const probes = this._renderContext.envProbes;

        // iterate all envprobes
        this.renderSceneToProbe(probeCount, probes, tmpEnvMapArray, false, true, scene);

        GLTextures.setTextureAt(this._envMapArrayUnit, null, gl.TEXTURE_2D_ARRAY);

        cubeProc.processSpecularLD(tmpEnvMapArray, this._envMapArray, this._renderContext.envProbeCount, this._numReservedTextures);
        // cubeProc.processDiffuse(tmpEnvMapArray, this._envMapArray, this._renderContext.envprobeCount, this._numReservedTextures);
        cubeProc.processSpecularDFG(this._specularDFG);

        cubeProc.release();

        tmpEnvMapArray.release();

        console.log("done.");
    }

    private renderSceneToProbe(probeCount: number, probes: EnvironmentProbe[], tmpEnvMapArray: Texture2DArray, useEnvmaps: boolean, useIrrmaps: boolean, scene: Scene) {
        const gl: WebGL2RenderingContext = GLDevice.gl; 
        
        const cubefaceCamera = new Camera();
        cubefaceCamera.autoUpdateTransform = false;
        cubefaceCamera.viewport = new vec4([0, 0, this._renderContext.envmapSize, this._renderContext.envmapSize]);
        
        const worldPosition = new vec3();
        const matWorldToProbe = mat4.identity.copyTo();
        const matViewProj = new mat4();

        const envMapDepthTexture = new Texture2D();
        
        envMapDepthTexture.width = this._renderContext.envmapSize;// * 6;
        envMapDepthTexture.height = this._renderContext.envmapSize;
        envMapDepthTexture.depth = 1;
        envMapDepthTexture.isShadowMap = true;
        envMapDepthTexture.format = gl.DEPTH_COMPONENT;               // NOTE: not DEPTH but DEPTH_COMPONENT !!!!
        envMapDepthTexture.componentType = gl.UNSIGNED_SHORT;         // use a 16 bit depth buffer for env cube

        envMapDepthTexture.create();

        const envMapFBO = new FrameBuffer();
        envMapFBO.depthStencilTexture = envMapDepthTexture;
        
        for (let ienvprobe = 0; ienvprobe < probeCount; ienvprobe++) {
            const envprobe = probes[ienvprobe];

            // use envprobe clipping properties to prevent light leaking.
            cubefaceCamera.projTransform = mat4.perspective(90, 1, envprobe.clippingStart, envprobe.clippingEnd);
            cubefaceCamera.near = envprobe.clippingStart;
            cubefaceCamera.far = envprobe.clippingEnd;
            // all envprobes must be axis aligned
            envprobe.worldTransform.getTranslation(worldPosition);
            matWorldToProbe.fromTranslation(worldPosition.negate());

            for (let iface = 0; iface < 6; iface++) {
                // set the cubemap texture array layer as render target
                envMapFBO.attachTexture(0, tmpEnvMapArray, 0, ienvprobe * 6 + iface);
                envMapFBO.prepare();
                // need to force set, or the target will be set to null in prepare() function
                GLDevice.renderTarget = envMapFBO;
                // GLDevice.forceSetRenderTarget(this._envmapFBO);
                const x = 0; //iface * this._renderContext.envmapSize;
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

                // setup cube face camera properties
                // transform objects to local space of envprobe first
                // then apply cube face view matrix
                const matFaceView = TextureCube.getFaceViewMatrix(iface);
                mat4.product(matFaceView, matWorldToProbe, cubefaceCamera.viewTransform);
                mat4.product(cubefaceCamera.projTransform, cubefaceCamera.viewTransform, matViewProj);
                this._frustum.setFromProjectionMatrix(matViewProj);
                // ensure the camera position passed in the shader is right;
                cubefaceCamera.viewTransform.copyTo(cubefaceCamera.worldTransform);
                cubefaceCamera.worldTransform.inverse();

                // set uniforms per view
                // will fill all visible lights, decals, envprobes;
                // is that necessary to render decals ? maybe not;
                // if not first time, fill envprobes, and set env texture
                // NOTE: need to apply irradiance probes !
                this._renderContext.fillUniformBuffersPerView(cubefaceCamera, true, false, useEnvmaps, useIrrmaps, false);

                if (scene.background !== undefined) {
                    if (scene.background instanceof TextureCube) {
                        this.renderSkyBox(scene.background,
                            envprobe.probeType === EnvironmentProbeType.Irradiance? scene.irradianceIntensity : scene.backgroundIntensity,
                            envprobe.worldTransform.getTranslation());
                    }
                }

                // render items in renderlist
                // only render static items; (there should be only static meshes in renderlist now)
                // fix me: is that necessary to use depth prepass and occlusion query?

                // depth prepass, can prevent pixel overdraw？
                this.setRenderStateSet(this._renderStatesDepthPrepass);
                GLPrograms.useProgram(this._depthPrepassProgram);
                this.renderItems(this._renderListDepthPrepass, this._frustum, this._itemFilterDepthPrepassProbe);
                // this.renderItems(this._renderListDepthPrepass, this._frustum, true, false, false, true);

                this.setRenderStateSet(this._renderStatesOpaque);

                this.renderItems(this._renderListOpaque, this._frustum, this._itemFilterOpaqueProbe);
                this.renderItems(this._renderListOpaqueOcclusionQuery, this._frustum, this._itemFilterOpaqueProbe);

                // this.renderItems(this._renderListOpaque, this._frustum, false, false, false, true);
                // this.renderItems(this._renderListOpaqueOcclusionQuery, this._frustum, false, false, false, true);

                // is that necessary to render transparent objects? yes, it is...
                // but there will not be reflections on these objects yet;


                // no after effects; to get accurate color values from environment
            }
        }

        envMapFBO.release();
        envMapDepthTexture.release();
    }

    /**
     * 注意：先 update irrance probes, 再 update cubemaps；
     * 
     * @param scene 
     */
    private updateIrradianceProbes(scene: Scene) {
        if (this._renderContext.irradianceProbeCount <= 0) {
            return;
        }

        console.log("updating irradiance probes...");

        if (this._irradianceProbesArray.glTexture) {
            this._irradianceProbesArray.release();
        }

        const gl = GLDevice.gl;

        GLTextures.setTextureAt(this._shadowmapAtlasUnit, this._shadowmapAtlas.texture);
        GLTextures.setTextureAt(this._irradianceProbeArrayUnit, null, gl.TEXTURE_2D_ARRAY);

        // resize irradiance probe array
        this._irradianceProbesArray.width = 1;
        this._irradianceProbesArray.height = 1;
        this._irradianceProbesArray.depth = this._renderContext.irradianceProbeCount * 6;
        this._irradianceProbesArray.mipLevels = 1;
        this._irradianceProbesArray.format = gl.RGBA;
        this._irradianceProbesArray.componentType = gl.HALF_FLOAT;
        this._irradianceProbesArray.samplerState = new SamplerState(gl.REPEAT, gl.REPEAT, gl.NEAREST, gl.NEAREST);

        this._irradianceProbesArray.create();

        // use a temp no mip texturearray and fbo to render cubemaps
        const tmpEnvMapArray = new Texture2DArray();

        tmpEnvMapArray.width = this._renderContext.envmapSize;// * 6;
        tmpEnvMapArray.height = this._renderContext.envmapSize;
        tmpEnvMapArray.depth = this._renderContext.irradianceProbeCount * 6;
        tmpEnvMapArray.mipLevels = 1;
        tmpEnvMapArray.format = gl.RGBA;
        tmpEnvMapArray.componentType = gl.HALF_FLOAT;
        tmpEnvMapArray.samplerState = new SamplerState(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
        tmpEnvMapArray.create();

        const cubeProc = new CubemapProcessor();

        // repeat several times to simulate multiple bounces
        // todo: 分开 irradiance probes 之后，这里就不用做多次反弹了
        const numBounces = 3;

        for (let ibounce = 0; ibounce < numBounces; ibounce++) {
            // if first bounce, do not use irradiance probes;
            // other times, use irradiance probes generate by last time
            if (ibounce === 0) {
                GLTextures.setTextureAt(this._irradianceProbeArrayUnit, null, gl.TEXTURE_2D_ARRAY);
            } else {
                GLTextures.setTextureAt(this._irradianceProbeArrayUnit, this._irradianceProbesArray, gl.TEXTURE_2D_ARRAY);
            }

            this.renderSceneToProbe(this._renderContext.irradianceProbeCount, this._renderContext.irradianceProbes, tmpEnvMapArray, false, ibounce != 0, scene);

            // todo: iterate all irradiance probes
            

            // use cubemaps to generate irradiance
            GLTextures.setTextureAt(this._irradianceProbeArrayUnit, null, gl.TEXTURE_2D_ARRAY);
            cubeProc.processIrradiance(tmpEnvMapArray, this._irradianceProbesArray, this._renderContext.irradianceProbeCount, this._numReservedTextures)
            GLDevice.renderTarget = null;
        }

        cubeProc.release();

        tmpEnvMapArray.release();

        console.log("done.");
    }
}

class RenderItemFilters {
    public ignoreMaterials: boolean = false;
    public checkOcclusionResults: boolean = false;
    public dynamics: boolean = true;
    public statics: boolean = true;
    public particles: boolean = false;
}
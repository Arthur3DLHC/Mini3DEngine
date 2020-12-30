import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock, SphereGeometry, CylinderGeometry, PlaneGeometry, PointLight, SpotLight, DirectionalLight, DirectionalLightShadow, EnvironmentProbe, SRTTransform, LoadingManager, TextureLoader, Texture, Texture2D, TextureCube, ImageLoader, SamplerState, EnvironmentProbeType, InstancedMesh } from "../../src/mini3DEngine.js";
import vec3 from "../../lib/tsm/vec3.js";
import { AutoRotateBehavior } from "../common/behaviors/autoRotateBehavior.js";
import vec4 from "../../lib/tsm/vec4.js";
import { LookatBehavior } from "../common/behaviors/lookatBehavior.js";
import { FirstPersonViewBehavior } from "../common/behaviors/firstPersonViewBehavior.js";
import mat4 from "../../lib/tsm/mat4.js";
import { SceneHelper } from "../common/sceneHelper.js";

window.onload = () => {
    const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
    if (!canvas) {
        console.error("Canvas not found");
        return;
    }

    GLDevice.initialize(canvas);

    const loadingManager = new LoadingManager();
    const imageLoader = new ImageLoader(loadingManager);
    const textureLoader = new TextureLoader(loadingManager);

    const renderer = new ClusteredForwardRenderer();
    const scene = new Scene();
    const camera = new PerspectiveCamera();
    camera.aspect = canvas.width / canvas.height;
    camera.far = 20;
    camera.localTransform.fromTranslation(new vec3([0, 0, 2]));
    camera.autoUpdateTransform = false;

    // first person view controller
    const fpsBehavior = new FirstPersonViewBehavior(camera);
    camera.behaviors.push(fpsBehavior);
    fpsBehavior.position = new vec3([0, 0, 2]);
    scene.attachChild(camera);

    window.onmousedown = (ev: MouseEvent) => {
        fpsBehavior.onMouseDown(ev);
    }

    window.onmouseup = (ev: MouseEvent) => {
        fpsBehavior.onMouseUp(ev);
    }

    window.onmousemove = (ev: MouseEvent) => {
        fpsBehavior.onMouseMove(ev);
    }

    window.onkeydown = (ev: KeyboardEvent) => {
        fpsBehavior.onKeyDown(ev);
    }

    window.onkeyup = (ev: KeyboardEvent) => {
        fpsBehavior.onKeyUp(ev);
    }

    // todo: put some occluder and occludees in scene

    // occluder box geometry
    const boxMesh = new Mesh();
    boxMesh.name = "wall";
    boxMesh.geometry = new BoxGeometry(2, 1, 0.25);
    boxMesh.castShadow = true;
    boxMesh.isStatic = false;
    boxMesh.autoUpdateTransform = true;    // let the behavior work
    // boxMesh.localTransform.fromTranslation(new vec3([0, 0, -5]));
    boxMesh.translation = new vec3([0, 0, 1]);
    const boxMtl = new StandardPBRMaterial();
    boxMtl.color = new vec4([1.0, 1.0, 0.0, 1.0]);
    boxMtl.metallic = 0.8;
    boxMtl.roughness = 0.4;
    boxMesh.materials.push(boxMtl);

    scene.attachChild(boxMesh);

    let sphereOcclusionResult = true;
    let cylinderOcclusionResult = true;
    let instOcclustionResult = true;

    // occludee sphere
    const sphereMesh = new Mesh();
    sphereMesh.name = "sphere.Static";
    sphereMesh.localTransform.fromTranslation(new vec3([-0.75, 0, 0]));
    sphereMesh.geometry = new SphereGeometry(0.4, 16, 8);
    sphereMesh.castShadow = true;
    sphereMesh.isStatic = true;
    sphereMesh.occlusionQuery = true;
    sphereMesh.autoUpdateTransform = false;
    const sphereMtl = new StandardPBRMaterial();
    sphereMtl.color = new vec4([1.0, 1.0, 1.0, 1.0]);
    sphereMtl.metallic = 0.05;
    sphereMtl.roughness = 0.95;
    sphereMesh.materials.push(sphereMtl);

    scene.attachChild(sphereMesh);

    // occludee cylinder

    const cylinderMesh = new Mesh();
    cylinderMesh.name = "cylinder01";
    cylinderMesh.localTransform.fromTranslation(new vec3([0.75, 0, 0]));
    cylinderMesh.geometry = new CylinderGeometry(0.25, 0.5, 24);
    cylinderMesh.castShadow = true;
    cylinderMesh.isStatic = true;
    cylinderMesh.occlusionQuery = true;
    cylinderMesh.autoUpdateTransform = false;
    const cylinderMtl = new StandardPBRMaterial();
    cylinderMtl.color = new vec4([0.0, 1.0, 0.0, 1.0]);
    cylinderMtl.emissive = new vec4([0.5, 0.5, 0.5, 1]);
    cylinderMtl.metallic = 0.2;
    cylinderMtl.roughness = 0.6;
    cylinderMesh.materials.push(cylinderMtl);

    scene.attachChild(cylinderMesh);

    // todo: occludee instanced mesh
    const instMesh = new InstancedMesh(100, false, 0, true);
    instMesh.name = "instances";
    instMesh.geometry = new CylinderGeometry(0.2, 0.8, 24);
    instMesh.castShadow = true;
    instMesh.isStatic = true;
    instMesh.occlusionQuery = true;
    instMesh.autoUpdateTransform = true;
    const instMtl = new StandardPBRMaterial();
    instMtl.color = new vec4([0, 0, 1, 1]);
    instMtl.metallic = 0.0;
    instMtl.roughness = 0.8;
    instMesh.materials.push(instMtl);

    for (let i = 0; i < instMesh.maxInstanceCount; i++) {
        const matRot: mat4 = mat4.identity.copy();
        matRot.fromZRotation(i * 0.03);

        const matTran: mat4 = mat4.identity.copy();
        const r = Math.floor(i / 10);
        const c = i % 10;
        matTran.fromTranslation(new vec3([r * 0.5, 0.5, c * 0.5 - 5]));

        const matInst: mat4 = new mat4();
        mat4.product(matTran, matRot, matInst);

        instMesh.setMatrixOf(i, matInst);
    }
    instMesh.curInstanceCount = instMesh.maxInstanceCount;
    instMesh.updateInstanceVertexBuffer();
    scene.attachChild(instMesh);

    const matPlaneRot = new mat4();
    const matPlaneTran = new mat4();

    matPlaneRot.setIdentity();
    matPlaneTran.fromTranslation(new vec3([0, -1, 0]));
    
    addPlane("floor", matPlaneTran, matPlaneRot, new vec4([1.0, 1.0, 1.0, 1.0]), 0.5, 0.5, scene);

    // TODO: add some lights
    const dirLight01 = new DirectionalLight();
    dirLight01.isStatic = true;
    dirLight01.autoUpdateTransform = false; // let the behaivor work
    dirLight01.on = true;
    dirLight01.color = new vec4([3,3,3,1]);
    dirLight01.radius = 5;
    dirLight01.castShadow = true;
    (dirLight01.shadow as DirectionalLightShadow).range = 15;
    const dirLightLookAt = new LookatBehavior(dirLight01);
    dirLight01.behaviors.push(dirLightLookAt);
    dirLightLookAt.position = new vec3([5, 5, 5]);
    dirLightLookAt.target = new vec3([0, 0, 0]);
    dirLightLookAt.up = new vec3([0, 1, 0]);

    scene.attachChild(dirLight01);
    
    // test environment probes
    SceneHelper.addEnvProbe("envProbe01", 6, new vec3([ 0, 0, 0]), scene, EnvironmentProbeType.Reflection);
    SceneHelper.addEnvProbe("irrProbe01", 6, new vec3([ 0, 0, 0]), scene, EnvironmentProbeType.Irradiance);

    // const infoPanel: HTMLDivElement = document.getElementById("infoPanel") as HTMLDivElement;
    const fpsLabel: HTMLDivElement = document.getElementById("fpsLabel") as HTMLDivElement;
    const sphereLabel: HTMLDivElement = document.getElementById("sphereLabel") as HTMLDivElement;
    const cylinderLabel: HTMLDivElement = document.getElementById("cylinderLabel") as HTMLDivElement;
    const instLabel: HTMLDivElement = document.getElementById("instanceLabel") as HTMLDivElement;

    let lastUpdateFPSTime = 0;
    let curFPS = 0;


    function gameLoop(now: number) {
        Clock.instance.update(now);
        scene.update();

        renderer.render(scene);

        if (now - lastUpdateFPSTime > 1000) {
            fpsLabel.innerHTML = curFPS.toString();
            lastUpdateFPSTime = now;
            curFPS = 0;
        }

        if (sphereMesh.occlusionQueryResult !== sphereOcclusionResult) {
            sphereLabel.innerHTML = sphereMesh.occlusionQueryResult ? "sphere:true" : "sphere:false";
            sphereOcclusionResult = sphereMesh.occlusionQueryResult;
        }

        if (cylinderMesh.occlusionQueryResult !== cylinderOcclusionResult) {
            cylinderLabel.innerHTML = cylinderMesh.occlusionQueryResult ? "cylinder:true" : "cylinder:false";
            cylinderOcclusionResult = cylinderMesh.occlusionQueryResult;
        }

        if (instMesh.occlusionQueryResult !== instOcclustionResult) {
            instLabel.innerHTML = instMesh.occlusionQueryResult ? "inst:true" : "inst:false";
            instOcclustionResult = instMesh.occlusionQueryResult;
        }

        curFPS++;

        requestAnimationFrame(gameLoop);
    }

    // todo: load skybox textures and start gameloop while all loaded.
    const envmapUrls: string[] = [
        "./textures/skyboxes/ballroom/px.png",
        "./textures/skyboxes/ballroom/nx.png",
        "./textures/skyboxes/ballroom/py.png",
        "./textures/skyboxes/ballroom/ny.png",
        "./textures/skyboxes/ballroom/pz.png",
        "./textures/skyboxes/ballroom/nz.png",
    ];

    const skyboxTexture: TextureCube = new TextureCube();

    for(let i = 0; i < 6; i++) {
        skyboxTexture.images[i] = imageLoader.load(envmapUrls[i], undefined, undefined,(ev) => {
            console.error("failed loading image.");
        });
    }
    
    loadingManager.onLoad = () => {
        skyboxTexture.componentType = GLDevice.gl.UNSIGNED_BYTE;
        skyboxTexture.format = GLDevice.gl.RGB;
        skyboxTexture.depth = 1;
        skyboxTexture.width = skyboxTexture.images[0].width;
        skyboxTexture.height = skyboxTexture.images[0].height;
        skyboxTexture.mipLevels = 1;
        skyboxTexture.samplerState = new SamplerState();
        skyboxTexture.upload();
        scene.background = skyboxTexture;

        Clock.instance.start();
        requestAnimationFrame(gameLoop);
    }
    
    function addPlane(name: string, matPlaneTran: mat4, matPlaneRot: mat4, wallColor: vec4, metallic: number, roughness: number, scene: Scene, textureUrl?:string) {
        const planeMesh = new Mesh();
        planeMesh.name = name;
        mat4.product(matPlaneTran, matPlaneRot, planeMesh.localTransform);
        planeMesh.geometry = new PlaneGeometry(4, 4, 1, 1);
        planeMesh.castShadow = true;
        planeMesh.isStatic = true;
        planeMesh.autoUpdateTransform = false;
        const planeMtl = new StandardPBRMaterial();
        planeMtl.color = wallColor.copy();
        planeMtl.metallic = metallic;// 0.05;
        planeMtl.roughness = roughness;// 0.8;
    
        // test load texture
        if(textureUrl !== undefined) {
            planeMtl.colorMap = textureLoader.load(textureUrl, (texture: Texture)=>{
                planeMtl.colorMapAmount = 1.0;
            }) as Texture2D;
        }
    
        planeMesh.materials.push(planeMtl);
        scene.attachChild(planeMesh);
    }
}



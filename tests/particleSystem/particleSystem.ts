import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock, SphereGeometry, CylinderGeometry, PlaneGeometry, PointLight, SpotLight, DirectionalLight, DirectionalLightShadow, EnvironmentProbe, SRTTransform, LoadingManager, TextureLoader, Texture, Texture2D, TextureCube, ImageLoader, SamplerState, EnvironmentProbeType, GPUParticleSystem, RotationLimitMode, GPUParticleMaterial, RenderStateCache } from "../../src/mini3DEngine.js";
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

    // todo: test multiple objects in scene at same time

    // test box geometry
    const boxMesh = new Mesh();
    boxMesh.name = "box01";
    boxMesh.geometry = new BoxGeometry(0.25, 0.25, 0.25);
    boxMesh.castShadow = true;
    boxMesh.isStatic = false;
    boxMesh.autoUpdateTransform = false;    // let the behavior work
    // boxMesh.localTransform.fromTranslation(new vec3([0, 0, -5]));
    const boxMtl = new StandardPBRMaterial();
    boxMtl.color = new vec4([1.0, 1.0, 0.0, 1.0]);
    boxMtl.metallic = 0.8;
    boxMtl.roughness = 0.4;
    boxMesh.materials.push(boxMtl);

    // auto rotate
    const boxAutoRot = new AutoRotateBehavior(boxMesh);
    boxMesh.behaviors.push(boxAutoRot);

    scene.attachChild(boxMesh);

    // moving sphere
    {
        const sphereMesh = new Mesh();
        sphereMesh.name = "sphere.Dynamic";
        sphereMesh.localTransform.fromTranslation(new vec3([0, 0, 0.75]));
        sphereMesh.geometry = new SphereGeometry(0.2, 16, 8);
        sphereMesh.castShadow = true;
        sphereMesh.isStatic = false;
        sphereMesh.autoUpdateTransform = false;
        const sphereMtl = new StandardPBRMaterial();
        sphereMtl.color = new vec4([1.0, 1.0, 1.0, 1.0]);
        sphereMtl.metallic = 0.9;
        sphereMtl.roughness = 0.5;
        sphereMtl.subsurface = 0.15;
        sphereMtl.subsurfaceColor = new vec3([0.4, 0.06, 0.0]);
        sphereMesh.materials.push(sphereMtl);
    
        boxMesh.attachChild(sphereMesh);
    }

    // static sphere
    {
        const sphereMesh = new Mesh();
        sphereMesh.name = "sphere.Static";
        sphereMesh.localTransform.fromTranslation(new vec3([-0.75, -1.2, 0]));
        sphereMesh.geometry = new SphereGeometry(0.4, 16, 8);
        sphereMesh.castShadow = true;
        sphereMesh.isStatic = true;
        sphereMesh.autoUpdateTransform = false;
        const sphereMtl = new StandardPBRMaterial();
        sphereMtl.color = new vec4([1.0, 1.0, 1.0, 1.0]);
        sphereMtl.metallic = 0.05;
        sphereMtl.roughness = 0.95;
        sphereMesh.materials.push(sphereMtl);
    
        scene.attachChild(sphereMesh);
    }

    /*
    const sphereAutoRot = new AutoRotateBehavior(sphereMesh);
    sphereMesh.behaviors.push(sphereAutoRot);

    scene.attachChild(sphereMesh);
    */

    const cylinderMesh = new Mesh();
    cylinderMesh.name = "cylinder01";
    cylinderMesh.localTransform.fromTranslation(new vec3([0.75, 0, 0]));
    cylinderMesh.geometry = new CylinderGeometry(0.25, 0.5, 24);
    cylinderMesh.castShadow = true;
    cylinderMesh.isStatic = true;
    cylinderMesh.autoUpdateTransform = false;
    const cylinderMtl = new StandardPBRMaterial();
    cylinderMtl.color = new vec4([0.0, 1.0, 0.0, 1.0]);
    cylinderMtl.emissive = new vec4([0.5, 0.5, 0.5, 1]);
    cylinderMtl.metallic = 0.2;
    cylinderMtl.roughness = 0.6;
    cylinderMesh.materials.push(cylinderMtl);

    /*
    const cylinderAutoRot = new AutoRotateBehavior(cylinderMesh);
    cylinderMesh.behaviors.push(cylinderAutoRot);
    */

    scene.attachChild(cylinderMesh);

    const matPlaneRot = new mat4();
    const matPlaneTran = new mat4();

    matPlaneRot.setIdentity();
    matPlaneTran.fromTranslation(new vec3([0, -2, 0]));
    
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

    // todo: particle system
    // geometry: use a plane?
    const particleGeom = new PlaneGeometry(1, 1, 1, 1, 2);

    // todo: test particle materials
    const particleMtl = new GPUParticleMaterial(renderer.context);
    particleMtl.cullState = RenderStateCache.instance.getCullState(false, GLDevice.gl.BACK);

    const gravity: vec3 = new vec3([0, 0, 0]);

    // add different type particles
    // or use control pannel to change current particle system?
    // or use control pannel to modify particle system properties?

    // todo: estimate max particle count by life and emit rate

    //#region billboard without rotation limit
    if(true)
    {
        const billboardsNoRotLimit = new GPUParticleSystem(500);
        billboardsNoRotLimit.name = "billboardNoRotLimit";
        billboardsNoRotLimit.isBillboard = true;
        billboardsNoRotLimit.rotationLimit = RotationLimitMode.NoLimit;
        billboardsNoRotLimit.castShadow = false;

        billboardsNoRotLimit.geometry = particleGeom;

        // location
        billboardsNoRotLimit.autoUpdateTransform = true;
        billboardsNoRotLimit.translation = new vec3([0, 0, 0]);

        // emitter and particle properties
    
        gravity.copyTo(billboardsNoRotLimit.gravity);

        billboardsNoRotLimit.rebuild();
        billboardsNoRotLimit.start();
        scene.attachChild(billboardsNoRotLimit);
    }
    //#endregion

    //#region billboard with rotatoin limit (arbitrary axis)
    if(false)
    {
        const billboardsLimitRotAxis = new GPUParticleSystem(500);
        billboardsLimitRotAxis.name = "billboardsLimitRotAxis";
        billboardsLimitRotAxis.isBillboard = true;
        billboardsLimitRotAxis.rotationLimit = RotationLimitMode.Axis;
        billboardsLimitRotAxis.rotationLimitAxis = new vec3([0, 1, 0]);
        billboardsLimitRotAxis.castShadow = false;

        billboardsLimitRotAxis.geometry = particleGeom;

        billboardsLimitRotAxis.autoUpdateTransform = true;
        billboardsLimitRotAxis.translation = new vec3([2, 0, 0]);

        // emitter and particle properties

        gravity.copyTo(billboardsLimitRotAxis.gravity);

        billboardsLimitRotAxis.rebuild();
        billboardsLimitRotAxis.start();
        scene.attachChild(billboardsLimitRotAxis);
    }
    //#endregion

    //#region billboard with rotatoin limit (move dir)
    if(false)
    {
        const billboardsLimitRotMoveDir = new GPUParticleSystem(500);
        billboardsLimitRotMoveDir.name = "billboardsLimitRotMoveDir";
        billboardsLimitRotMoveDir.isBillboard = true;
        billboardsLimitRotMoveDir.rotationLimit = RotationLimitMode.MoveDir;
        billboardsLimitRotMoveDir.castShadow = false;

        billboardsLimitRotMoveDir.geometry = particleGeom;

        billboardsLimitRotMoveDir.autoUpdateTransform = true;
        billboardsLimitRotMoveDir.translation = new vec3([4, 0, 0]);

        // emitter and particle properties

        gravity.copyTo(billboardsLimitRotMoveDir.gravity);

        billboardsLimitRotMoveDir.rebuild();
        billboardsLimitRotMoveDir.start();
        scene.attachChild(billboardsLimitRotMoveDir);
    }
    //#endregion

    //#region not billboard without rotation limit
    if(false)
    {
        const planesNoRotLimit = new GPUParticleSystem(500);
        planesNoRotLimit.name = "planesNoRotLimit";
        planesNoRotLimit.isBillboard = false;
        planesNoRotLimit.rotationLimit = RotationLimitMode.NoLimit;
        planesNoRotLimit.castShadow = false;

        planesNoRotLimit.geometry = particleGeom;

        planesNoRotLimit.autoUpdateTransform = true;
        planesNoRotLimit.translation = new vec3([0, 0, -2]);

        // test emitter and particle properties
        planesNoRotLimit.emitterSize = new vec3([2, 2, 2]);
        planesNoRotLimit.minSize = new vec3([0.5, 0.5, 0.5]);
        planesNoRotLimit.maxSize = new vec3([1, 1, 1]);
        planesNoRotLimit.emitDirection = new vec3([0, 1, 0]);
        planesNoRotLimit.emitDirectionVariation = 1;
        planesNoRotLimit.minSpeed = 0.5;
        planesNoRotLimit.maxSpeed = 1.5;

        planesNoRotLimit.minAngle = 0;
        planesNoRotLimit.maxAngle = Math.PI * 2;
        planesNoRotLimit.minAngularSpeed = -1;
        planesNoRotLimit.maxAngularSpeed = 1;

        gravity.copyTo(planesNoRotLimit.gravity);

        // todo: psys material; tansparent;
        planesNoRotLimit.material = particleMtl;

        planesNoRotLimit.rebuild();
        planesNoRotLimit.start();
        scene.attachChild(planesNoRotLimit);
    }
    //#endregion

    //#region not billboard with rotation limit (arbitrary axis)
    if(false)
    {
        const planesLimitRotAxis = new GPUParticleSystem(500);
        planesLimitRotAxis.name = "planesLimitRotAxis";
        planesLimitRotAxis.isBillboard = false;
        planesLimitRotAxis.rotationLimit = RotationLimitMode.Axis;
        planesLimitRotAxis.rotationLimitAxis = new vec3([0, 1, 0]);
        planesLimitRotAxis.castShadow = false;

        planesLimitRotAxis.geometry = particleGeom;

        planesLimitRotAxis.autoUpdateTransform = true;
        planesLimitRotAxis.translation = new vec3([2, 0, -2]);

        // emitter and particle properties

        gravity.copyTo(planesLimitRotAxis.gravity);

        planesLimitRotAxis.rebuild();
        planesLimitRotAxis.start();
        scene.attachChild(planesLimitRotAxis);
    }
    //#endregion

    //#region not billboard with rotation limit (move dir)
    if(false)
    {
        const planesLimitMoveDir = new GPUParticleSystem(500);
        planesLimitMoveDir.name = "planesLimitMoveDir";
        planesLimitMoveDir.isBillboard = false;
        planesLimitMoveDir.rotationLimit = RotationLimitMode.MoveDir;
        planesLimitMoveDir.castShadow = false;

        planesLimitMoveDir.geometry = particleGeom;

        planesLimitMoveDir.autoUpdateTransform = true;
        planesLimitMoveDir.translation = new vec3([4, 0, -2]);

        // emitter and particle properties

        gravity.copyTo(planesLimitMoveDir.gravity);

        planesLimitMoveDir.rebuild();
        planesLimitMoveDir.start();
        scene.attachChild(planesLimitMoveDir);
    }
    //#endregion

    // todo: particle system material, render states, textures
    // todo: test texture animation

    // todo: particle system custom materials


    // test environment probes
    SceneHelper.addEnvProbe("envProbe01", 6, new vec3([ 0, 0, 0]), scene, EnvironmentProbeType.Reflection);
    SceneHelper.addEnvProbe("irrProbe01", 6, new vec3([ 0, 0, 0]), scene, EnvironmentProbeType.Irradiance);

    const infoPanel: HTMLDivElement = document.getElementById("infoPanel") as HTMLDivElement;

    let lastUpdateFPSTime = 0;
    let curFPS = 0;


    function gameLoop(now: number) {
        Clock.instance.update(now);
        scene.update();

        renderer.render(scene);

        if (now - lastUpdateFPSTime > 1000) {
            infoPanel.innerHTML = curFPS.toString();
            lastUpdateFPSTime = now;
            curFPS = 0;
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
        planeMtl.color = wallColor.copyTo();
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



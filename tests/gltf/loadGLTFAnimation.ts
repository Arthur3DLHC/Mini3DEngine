import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock, SphereGeometry, CylinderGeometry, PlaneGeometry, PointLight, SpotLight, DirectionalLight, DirectionalLightShadow, EnvironmentProbe, SRTTransform, LoadingManager, TextureLoader, Texture, Texture2D, TextureCube, ImageLoader, SamplerState, GLTFLoader, GLTFSceneBuilder, GltfAsset, Object3D } from "../../src/mini3DEngine.js";
import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";
import { LookatBehavior } from "../common/behaviors/lookatBehavior.js";
import { FirstPersonViewBehavior } from "../common/behaviors/firstPersonViewBehavior.js";
import { SkinMesh } from "../../src/scene/skinMesh.js";
import { AnimationAction, AnimationLoopMode } from "../../src/animation/animationAction.js";
import quat from "../../lib/tsm/quat.js";

/**
 * Load gltf files using promise
 */

window.onload = () => {
    const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
    if (!canvas) {
        console.error("Canvas not found");
        return;
    }

    GLDevice.initialize(canvas);

    const loadingManager = new LoadingManager();
    const imageLoader = new ImageLoader(loadingManager);
    // const textureLoader = new TextureLoader(loadingManager);
    const gltfLoader = new GLTFLoader(loadingManager);

    const renderer = new ClusteredForwardRenderer();
    const scene = new Scene();
    const camera = new PerspectiveCamera();
    camera.fov = 45;
    camera.aspect = canvas.width / canvas.height;
    camera.far = 20;
    camera.localTransform.fromTranslation(new vec3([0, 1.7, 2]));
    camera.autoUpdateTransform = false;

    // first person view controller
    const fpsBehavior = new FirstPersonViewBehavior(camera);
    camera.behaviors.push(fpsBehavior);
    fpsBehavior.position = new vec3([0, 1.7, 2]);
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


    // add some lights
    const dirLight01 = new DirectionalLight();
    dirLight01.isStatic = true;
    dirLight01.autoUpdateTransform = false; // let the behaivor work
    dirLight01.on = true;
    dirLight01.color = new vec4([2,2,2,1]);
    dirLight01.radius = 2;
    dirLight01.castShadow = true;
    const shadow = (dirLight01.shadow as DirectionalLightShadow);
    shadow.distance = 10;
    shadow.radius = 2;
    const dirLightLookAt = new LookatBehavior(dirLight01);
    dirLight01.behaviors.push(dirLightLookAt);
    dirLightLookAt.position = new vec3([5, 5, 5]);
    dirLightLookAt.target = new vec3([0, 0, 0]);
    dirLightLookAt.up = new vec3([0, 1, 0]);

    scene.attachChild(dirLight01);
    
    // test environment probes
    addEnvProbe("envProbe01", 6, new vec3([ 0, 0, 0]), scene);

    const infoPanel: HTMLDivElement = document.getElementById("infoPanel") as HTMLDivElement;

    let lastUpdateFPSTime = 0;
    let curFPS = 0;

    const actions: AnimationAction[] = [];
    let curAction: AnimationAction | undefined = undefined;

    function gameLoop(now: number) {
        Clock.instance.update(now);
        scene.updateBehavior();
        if (curAction !== undefined) {
            curAction.update(Clock.instance.curTime, Clock.instance.elapsedTime);
        }
        scene.updateWorldTransform(false, true);
        SkinMesh.updateSkinMeshes(scene);
        renderer.render(scene);

        if (now - lastUpdateFPSTime > 1000) {
            infoPanel.innerHTML = curFPS.toString();
            lastUpdateFPSTime = now;
            curFPS = 0;
        }

        curFPS++;

        requestAnimationFrame(gameLoop);
    }

    console.log("loading gltf model...");

    // todo: adjust the way that promise and loadingManager cooperate
    // const gltfPromise: Promise<GltfAsset> = gltfLoader.load("./models/Box/glTF/Box.gltf");
    // const gltfPromise: Promise<GltfAsset> = gltfLoader.load("./models/BoxInterleaved/glTF/BoxInterleaved.gltf");
    // const gltfPromise: Promise<GltfAsset> = gltfLoader.load("./models/BoxTextured/glTF/BoxTextured.gltf");
    // const gltfPromise: Promise<GltfAsset> = gltfLoader.load("./models/DamagedHelmet/glTF/DamagedHelmet.gltf");
    const gltfPromise: Promise<GltfAsset> = gltfLoader.load("./models/std_female/std_female_anim.gltf");

    console.log("loading skybox...");

    const imagePromises: (Promise<HTMLImageElement>)[] = [];
    const envmapUrls: string[] = [
        "./textures/skyboxes/ballroom/px.png",
        "./textures/skyboxes/ballroom/nx.png",
        "./textures/skyboxes/ballroom/py.png",
        "./textures/skyboxes/ballroom/ny.png",
        "./textures/skyboxes/ballroom/pz.png",
        "./textures/skyboxes/ballroom/nz.png",
    ];
    for (let i = 0; i < 6; i++) {
        const imgPromise: Promise<HTMLImageElement> = imageLoader.loadPromise(envmapUrls[i]);
        imagePromises.push(imgPromise);
    }

    const imagesPromise = Promise.all(imagePromises);

    // fix me: type error
    Promise.all([gltfPromise, imagesPromise]).then((loaded) => {
        const skyboxTexture: TextureCube = new TextureCube();

        for(let i = 0; i < 6; i++) {
            skyboxTexture.images[i] = loaded[1][i];
        }

        skyboxTexture.componentType = GLDevice.gl.UNSIGNED_BYTE;
        skyboxTexture.format = GLDevice.gl.RGB;
        skyboxTexture.depth = 1;
        skyboxTexture.width = skyboxTexture.images[0].width;
        skyboxTexture.height = skyboxTexture.images[0].height;
        skyboxTexture.mipLevels = 1;
        skyboxTexture.samplerState = new SamplerState();
        skyboxTexture.upload();
        scene.background = skyboxTexture;
        
        // gltf asset should has been already loaded?
        console.log("building gltf scene...");


        const builder = new GLTFSceneBuilder();
        const gltfScene = builder.build(loaded[0], 0, actions);
        gltfScene.rotation = quat.fromAxisAngle(new vec3([0, 1, 0]), Math.PI);
        gltfScene.autoUpdateTransform = true;
        scene.attachChild(gltfScene);

        prepareGLTFScene(gltfScene);

        // todo: add all action names to action list UI
        const actionList: HTMLDivElement = document.getElementById("actionList") as HTMLDivElement;
        actionList.innerHTML = "";

        if (actions.length > 0) {
            curAction = actions[0];
            curAction.LoopMode = AnimationLoopMode.Repeat;
            curAction.play();

            let actidx = 0;
            for (const act of actions) {
                // click callback
                const actionItem: HTMLDivElement = document.createElement("div");
                actionItem.id = "action_" + actidx;
                actionItem.innerHTML = act.name;
                actionItem.className = "actionItem";
                actionItem.onclick = (ev: MouseEvent) => {
                    if (curAction !== undefined) {
                        curAction.stop();
                        curAction.reset();
                    }
                    curAction = act;
                    curAction.LoopMode = AnimationLoopMode.Repeat;
                    curAction.play();
                }
                actionList.appendChild(actionItem);
                actidx++;
            }
        }

        console.log("start game loop...");

        Clock.instance.start();
        requestAnimationFrame(gameLoop);


    });

    function addEnvProbe(name: string, size: number, position: vec3, scene: Scene) {
        const probe = new EnvironmentProbe();
        probe.name = name;
        const probesrt = new SRTTransform();
        probesrt.scaling.x = size; probesrt.scaling.y = size; probesrt.scaling.z = size;
        position.copy(probesrt.translation);
        probesrt.update();
        probesrt.transform.copy(probe.localTransform);
    
        scene.attachChild(probe);
    }

    function prepareGLTFScene(gltfNode: Object3D) {
        // gltfNode.isStatic = true;
        
        if (gltfNode instanceof Mesh) {
            gltfNode.castShadow = true;
            gltfNode.receiveShadow = true;
        }

        for (const child of gltfNode.children) {
            prepareGLTFScene(child);
        }
    }
}



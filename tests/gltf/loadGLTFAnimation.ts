import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock, SphereGeometry, CylinderGeometry, PlaneGeometry, PointLight, SpotLight, DirectionalLight, DirectionalLightShadow, EnvironmentProbe, SRTTransform, LoadingManager, TextureLoader, Texture, Texture2D, TextureCube, ImageLoader, SamplerState, GLTFLoader, GLTFSceneBuilder, GltfAsset, Object3D, BoundingRenderModes, ActionSelector, SkinMesh } from "../../src/mini3DEngine.js";
import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";
import { LookatBehavior } from "../common/behaviors/lookatBehavior.js";
import { FirstPersonViewBehavior } from "../common/behaviors/firstPersonViewBehavior.js";
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
    shadow.range = 10;
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

    // const actionsFemale: AnimationAction[] = [];
    // const actionsMale: AnimationAction[] = [];
    // let curActionFemale: AnimationAction | undefined = undefined;
    // let curActionMale: AnimationAction | undefined = undefined;

    const actionSelectorFemale: ActionSelector = new ActionSelector();
    const actionSelectorMale: ActionSelector = new ActionSelector();

    function gameLoop(now: number) {
        Clock.instance.update(now);
        scene.updateBehavior();

        actionSelectorFemale.update(Clock.instance.curTime, Clock.instance.elapsedTime);
        actionSelectorMale.update(Clock.instance.curTime, Clock.instance.elapsedTime);

        // if (curActionFemale !== undefined) {
        //     curActionFemale.update(Clock.instance.curTime, Clock.instance.elapsedTime);
        // }
        // if (curActionMale !== undefined) {
        //     curActionMale.update(Clock.instance.curTime, Clock.instance.elapsedTime);
        // }

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
    const gltfPromiseFemale: Promise<GltfAsset> = gltfLoader.load("./models/std_female/std_female_animation.gltf");
    const gltfPromiseMale: Promise<GltfAsset> = gltfLoader.load("./models/std_male/std_male_animation.gltf");

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
    Promise.all([gltfPromiseFemale, gltfPromiseMale, imagesPromise]).then((loaded) => {
        const skyboxTexture: TextureCube = new TextureCube();

        for(let i = 0; i < 6; i++) {
            skyboxTexture.images[i] = loaded[2][i];
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
        
        const gltfSceneFemale = builder.build(loaded[0], 0, actionSelectorFemale.actions);
        // gltfSceneFemale.rotation = quat.fromAxisAngle(new vec3([0, 1, 0]), Math.PI);
        gltfSceneFemale.name = "Female";
        gltfSceneFemale.autoUpdateTransform = true;
        scene.attachChild(gltfSceneFemale);

        prepareGLTFScene(gltfSceneFemale);

        const gltfSceneMale = builder.build(loaded[1], 0, actionSelectorMale.actions);
        // gltfSceneMale.rotation = quat.fromAxisAngle(new vec3([0, 1, 0]), Math.PI);
        gltfSceneMale.name = "Male";
        gltfSceneMale.autoUpdateTransform = true;
        scene.attachChild(gltfSceneMale);

        prepareGLTFScene(gltfSceneMale);

        // todo: add all action names to action list UI
        const actionListFemale: HTMLDivElement = document.getElementById("actionList_female") as HTMLDivElement;
        const actionListMale: HTMLDivElement = document.getElementById("actionList_male") as HTMLDivElement;
        actionListFemale.innerHTML = "";
        actionListMale.innerHTML = "";

        if (actionSelectorFemale.actions.length > 0) {
            actionSelectorFemale.playAction(actionSelectorFemale.actions[0].name);

            let actidx = 0;
            for (const act of actionSelectorFemale.actions) {
                // click callback
                // NOTE: can not all constructor of HTMLElements in TypeScript.
                // Can only call document.createElement()
                const actionItem: HTMLDivElement = document.createElement("div");
                actionItem.id = "action_female_" + actidx;
                actionItem.innerHTML = act.name;
                actionItem.className = "actionItem";
                actionItem.onclick = (ev: MouseEvent) => {
                    actionSelectorFemale.playAction(act.name);
                }
                actionListFemale.appendChild(actionItem);
                actidx++;
            }
        }

        if (actionSelectorMale.actions.length > 0) {
            actionSelectorMale.playAction(actionSelectorMale.actions[0].name);

            let actidx = 0;
            for (const act of actionSelectorMale.actions) {
                // click callback
                // NOTE: can not all constructor of HTMLElements in TypeScript.
                // Can only call document.createElement()
                const actionItem: HTMLDivElement = document.createElement("div");
                actionItem.id = "action_male_" + actidx;
                actionItem.innerHTML = act.name;
                actionItem.className = "actionItem";
                actionItem.onclick = (ev: MouseEvent) => {
                    actionSelectorMale.playAction(act.name);
                }
                actionListMale.appendChild(actionItem);
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
            gltfNode.boundingSphereRenderMode = BoundingRenderModes.normal;
        }

        for (const child of gltfNode.children) {
            prepareGLTFScene(child);
        }
    }
}



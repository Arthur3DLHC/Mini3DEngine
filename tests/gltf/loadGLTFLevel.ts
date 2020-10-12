import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock, SphereGeometry, CylinderGeometry, PlaneGeometry, PointLight, SpotLight, DirectionalLight, DirectionalLightShadow, EnvironmentProbe, SRTTransform, LoadingManager, TextureLoader, Texture, Texture2D, TextureCube, ImageLoader, SamplerState, GLTFLoader, GLTFSceneBuilder, GltfAsset, Object3D, BoundingRenderModes, InstancedMesh, DebugRenderer } from "../../src/mini3DEngine.js";
import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";
import { LookatBehavior } from "../common/behaviors/lookatBehavior.js";
import { FirstPersonViewBehavior } from "../common/behaviors/firstPersonViewBehavior.js";
import { SkinMesh } from "../../src/scene/skinMesh.js";

/**
 * Load gltf files using promise
 */

window.onload = () => {
    const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
    if (!canvas) {
        console.error("Canvas not found");
        return;
    }

    canvas.width = Math.max(1280, window.innerWidth - 50);
    canvas.height = Math.max(720, window.innerHeight - 50);

    GLDevice.initialize(canvas);

    const loadingManager = new LoadingManager();
    const imageLoader = new ImageLoader(loadingManager);
    // const textureLoader = new TextureLoader(loadingManager);
    const gltfLoader = new GLTFLoader(loadingManager);

    const renderer = new ClusteredForwardRenderer();
    renderer.debugRenderer.showClusters = false;
    renderer.debugRenderer.clusterDrawMode = DebugRenderer.ClusterDrawMode_IrrProbeCount;
    renderer.debugRenderer.itemCountRef = 4;

    const scene = new Scene();
    const camera = new PerspectiveCamera();
    camera.aspect = canvas.width / canvas.height;
    camera.far = 40;
    camera.localTransform.fromTranslation(new vec3([0, 0, 2]));
    camera.autoUpdateTransform = false;

    // first person view controller
    const fpsBehavior = new FirstPersonViewBehavior(camera);
    camera.behaviors.push(fpsBehavior);
    fpsBehavior.position = new vec3([0, 1.7, 0]);
    fpsBehavior.moveSpeed = 1.5;
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
    // lights will be added from gltf
    /*
    const dirLight01 = new DirectionalLight();
    dirLight01.isStatic = true;
    dirLight01.autoUpdateTransform = false; // let the behaivor work
    dirLight01.on = true;
    dirLight01.color = new vec4([1,1,1,1]);
    dirLight01.radius = 2;
    dirLight01.castShadow = true;
    (dirLight01.shadow as DirectionalLightShadow).distance = 15;
    const dirLightLookAt = new LookatBehavior(dirLight01);
    dirLight01.behaviors.push(dirLightLookAt);
    dirLightLookAt.position = new vec3([5, 5, 5]);
    dirLightLookAt.target = new vec3([0, 0, 0]);
    dirLightLookAt.up = new vec3([0, 1, 0]);

    scene.attachChild(dirLight01);
    */

    // test environment probes
    // envprobes will be loaded from the gltf scene
    // addEnvProbe("envProbe01", 20, new vec3([ 0, 2, 0]), scene);

    const infoPanel: HTMLDivElement = document.getElementById("infoPanel") as HTMLDivElement;

    let lastUpdateFPSTime = 0;
    let curFPS = 0;


    function gameLoop(now: number) {
        Clock.instance.update(now);
        scene.updateBehavior();
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
    const gltfPromise: Promise<GltfAsset> = gltfLoader.load("./models/SCIFI/level_1/robot_maintance_area.gltf");

    // todo: use an outdoor scene skybox
    console.log("loading skybox...");

    const imagePromises: (Promise<HTMLImageElement|ImageData>)[] = [];
    const isHDR = false;
    let envmapUrls: string[];

    if (isHDR) {
        envmapUrls = [
            "./textures/skyboxes/rooitou_park_hdr/px.hdr",
            "./textures/skyboxes/rooitou_park_hdr/nx.hdr",
            "./textures/skyboxes/rooitou_park_hdr/py.hdr",
            "./textures/skyboxes/rooitou_park_hdr/ny.hdr",
            "./textures/skyboxes/rooitou_park_hdr/pz.hdr",
            "./textures/skyboxes/rooitou_park_hdr/nz.hdr",
        ]
    } else {
        envmapUrls = [
            "./textures/skyboxes/space/px.jpg",
            "./textures/skyboxes/space/nx.jpg",
            "./textures/skyboxes/space/py.jpg",
            "./textures/skyboxes/space/ny.jpg",
            "./textures/skyboxes/space/pz.jpg",
            "./textures/skyboxes/space/nz.jpg",
        ];
    }

    for (let i = 0; i < 6; i++) {
        const imgPromise: Promise<HTMLImageElement|ImageData> = imageLoader.loadPromise(envmapUrls[i]);
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
        skyboxTexture.format = isHDR ? GLDevice.gl.RGBA : GLDevice.gl.RGB;
        skyboxTexture.isHDR = isHDR;
        skyboxTexture.depth = 1;
        skyboxTexture.width = skyboxTexture.images[0].width;
        skyboxTexture.height = skyboxTexture.images[0].height;
        skyboxTexture.mipLevels = 1;
        skyboxTexture.samplerState = new SamplerState();
        skyboxTexture.upload();
        scene.background = skyboxTexture;
        scene.backgroundIntensity = 1;
        
        // gltf asset should has been already loaded?
        console.log("building gltf scene...");

        const builder = new GLTFSceneBuilder();
        const gltfScene = builder.build(loaded[0], 0, undefined, true);
        scene.attachChild(gltfScene);

        prepareGLTFScene(gltfScene);

        scene.updateWorldTransform(false, true);
        InstancedMesh.updateInstancedMeshes(gltfScene);

        console.log("start game loop...");

        Clock.instance.start();
        requestAnimationFrame(gameLoop);


    });

    function prepareGLTFScene(gltfNode: Object3D) {
        gltfNode.isStatic = true;
        gltfNode.autoUpdateTransform = false;
        
        if (gltfNode instanceof Mesh) {
            gltfNode.castShadow = true;
            gltfNode.receiveShadow = true;
            gltfNode.boundingSphereRenderMode = BoundingRenderModes.none;
        }
        else if (gltfNode instanceof EnvironmentProbe) {
            const envProbe = gltfNode as EnvironmentProbe;
            // envProbe.debugDraw = true;
        }

        for (const child of gltfNode.children) {
            prepareGLTFScene(child);
        }
    }
}



import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock, SphereGeometry, CylinderGeometry, PlaneGeometry, PointLight, SpotLight, DirectionalLight, DirectionalLightShadow, EnvironmentProbe, SRTTransform, LoadingManager, TextureLoader, Texture, Texture2D, TextureCube, ImageLoader, SamplerState, GLTFLoader, GLTFSceneBuilder, EnvironmentProbeType } from "../../src/mini3DEngine.js";
import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";
import { LookatBehavior } from "../common/behaviors/lookatBehavior.js";
import { FirstPersonViewBehavior } from "../common/behaviors/firstPersonViewBehavior.js";
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
    // const textureLoader = new TextureLoader(loadingManager);
    const gltfLoader = new GLTFLoader(loadingManager);

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


    // add some lights
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

       


    // todo: test load gltf file then create 3d object
    // todo: adjust the way that promise and loadingManager cooperate
    const promise = gltfLoader.load("./models/Box/glTF/Box.gltf");

    promise.then((gltfAsset) => {
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

            // gltf asset should has been already loaded?
            const builder = new GLTFSceneBuilder();
            const gltfScene = builder.build(gltfAsset, 0);
            scene.attachChild(gltfScene);
    
            Clock.instance.start();
            requestAnimationFrame(gameLoop);
        }

        for (let i = 0; i < 6; i++) {
            skyboxTexture.images[i] = imageLoader.load(envmapUrls[i], undefined, undefined, (ev) => {
                console.error("failed loading image.");
            });
        }
    });
}



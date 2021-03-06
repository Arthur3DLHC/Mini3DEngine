import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock, SphereGeometry, CylinderGeometry, PlaneGeometry, PointLight, SpotLight, DirectionalLight, DirectionalLightShadow, EnvironmentProbe, SRTTransform, LoadingManager, TextureLoader, Texture, Texture2D, TextureCube, ImageLoader, SamplerState, EnvironmentProbeType, PhysicsWorld, RigidBody, GltfAsset, GLTFLoader, GLTFSceneBuilder, AnimationAction, Object3D, ActionControlBehavior, AnimationLayer, ActionStateMachine, ActionStateSingleAnim, ActionTransition, ActionCondition, ActionStateBlendTree, AnimationBlendNode, BlendMethods, SingleParamCondition, TimeUpCondition, AnimationMask, SkinMesh, AnimationLoopMode, InstancedMesh, SilhouetteSelectMode, ConstraintProcessor, GameObjectCreator } from "../../src/mini3DEngine.js";
import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";
import { LookatBehavior } from "../common/behaviors/lookatBehavior.js";
import { SceneHelper } from "../common/sceneHelper.js";
import quat from "../../lib/tsm/quat.js";
import vec2 from "../../lib/tsm/vec2.js";
import { TPSPlayerBehavior } from "./behaviors/tpsPlayerBehavior.js";
import { SciFiGameObjCreator } from "./scifiGameObjCreator.js";
import { PlayerPrefab } from "./prefabs/playerPrefab.js";
import { InfectedFemalePrefab } from "./prefabs/infectedFemalePrefab.js";
import { ObjectCategory } from "./objectCategory.js";
import { GameWorld } from "./gameWorld.js";

window.onload = () => {
    const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
    if (!canvas) {
        console.error("Canvas not found");
        return;
    }

    const showMature = confirm("Show mature contents?");

    GLDevice.initialize(canvas);

    // todo: pointer lock
    const havePointerLock = "pointerLockElement" in document;
    if (havePointerLock) {
        canvas.onclick = function() {
            canvas.requestPointerLock();
        }
        document.addEventListener("pointerlockchange", pointerLockChange, false);
    } else {
        // no pointer lock...
        alert("Your browser doesn\'t seem to support Pointer Lock API");
    }

    const crosshair = document.getElementById("crosshair") as HTMLDivElement;
    // '8' is HTML body default margin...
    crosshair.style.left = String(8 + (canvas.width - 4) / 2) + "px";
    crosshair.style.top = String(8 + (canvas.height - 4) / 2) + "px"; 

    let tpsBehavior: TPSPlayerBehavior | undefined = undefined;

    const infoPanel: HTMLDivElement = document.getElementById("infoPanel") as HTMLDivElement;

    let lastUpdateFPSTime = 0;
    let curFPS = 0;

    /** save notebook GPU */
    const halfFPSMode = showMature;

    const addObjectsManually = false;

    let skipThisFrame = false;

    const physicsWorld = new PhysicsWorld({ numIterations: 10 });
    const world = physicsWorld.world;
    world.gravity.set(0.0, -9.0, 0.0);
    world.defaultContactMaterial.contactEquationStiffness = 1e8
    world.defaultContactMaterial.contactEquationRelaxation = 3

    // use a slippery material between player and ground

    const playerPhysicsMtl = new CANNON.Material("playerMaterial");
    const groundPhysicsMtl = new CANNON.Material("groundMaterial");
    const widgetPhysicsMtl = new CANNON.Material("widgetMaterial");
    const player_ground_cm = new CANNON.ContactMaterial(playerPhysicsMtl, groundPhysicsMtl,
        { friction: 0.0, restitution: 0.3, contactEquationRelaxation: 3, contactEquationStiffness: 1e8, frictionEquationStiffness: 1e8, frictionEquationRelaxation: 3 });
    const player_widget_cm = new CANNON.ContactMaterial(playerPhysicsMtl, widgetPhysicsMtl,
        { friction: 0.4, restitution: 0.3, contactEquationRelaxation: 3, contactEquationStiffness: 1e8, frictionEquationStiffness: 1e8, frictionEquationRelaxation: 3 });
    const widget_ground_cm = new CANNON.ContactMaterial(widgetPhysicsMtl, groundPhysicsMtl,
        { friction: 0.4, restitution: 0.3, contactEquationRelaxation: 3, contactEquationStiffness: 1e8, frictionEquationStiffness: 1e8, frictionEquationRelaxation: 3 });
    world.addContactMaterial(player_ground_cm);
    world.addContactMaterial(player_widget_cm);
    world.addContactMaterial(widget_ground_cm);

    const loadingManager = new LoadingManager();
    const imageLoader = new ImageLoader(loadingManager);
    const textureLoader = new TextureLoader(loadingManager);
    const gltfLoader = new GLTFLoader(loadingManager);

    const renderer = new ClusteredForwardRenderer();
    renderer.postprocessor.bloom.intensity = 0.3;
    renderer.postprocessor.bloom.radius = 0.2;
    renderer.postprocessor.bloom.threshold = 1.5;
    renderer.postprocessor.silhouette.enable = true;
    renderer.postprocessor.silhouette.maxDistance = 3.0;
    renderer.postprocessor.silhouette.width = 2.0;
    renderer.postprocessor.silhouette.selectMode = SilhouetteSelectMode.ByCursor;
    renderer.postprocessor.silhouette.cursor = new vec2([canvas.width / 2, canvas.height / 2]);
    renderer.postprocessor.silhouette.setSilhouetteColor(ObjectCategory.DANGER_ITEMS, new vec4([1, 0, 0, 1]));
    renderer.postprocessor.silhouette.setSilhouetteColor(ObjectCategory.INTERACTIVE, new vec4([0, 1, 0, 1]));
    renderer.postprocessor.silhouette.setSilhouetteColor(ObjectCategory.LOCKED, new vec4([1, 1, 0, 1]));
    renderer.postprocessor.silhouette.setSilhouetteColor(ObjectCategory.ENEMIES, new vec4([1, 0, 0, 1]));
    // renderer.postprocessor.silhouette.setSilhouetteColor(ObjectCategory.ENEMIES, new vec4([0, 0, 0, 0])); // no silhouette but pickable

    GameWorld.objectTagRenderer = renderer.objectTagRenderer;

    const scene = new Scene();
    const camera = new PerspectiveCamera();
    camera.aspect = canvas.width / canvas.height;
    camera.far = 30;
    // camera.localTransform.fromTranslation(new vec3([0, 0, 2]));
    camera.autoUpdateTransform = true;

    scene.attachChild(camera);

    addTestDynamicObjects(physicsWorld, widgetPhysicsMtl, scene, groundPhysicsMtl);

    // add some objects to scene
    // test box geometry

    console.log("loading gltf models...");

    // character models
    const characterModelKeys: string[] = ["playerFemale", "infectedFemale", "slicerFemale"];
    const gltfCharacterPromises: Promise<GltfAsset>[] = [];
    gltfCharacterPromises.push(gltfLoader.load("./models/SCIFI/heroes/cyberGirl/CyberGirl_animation.gltf"));
    gltfCharacterPromises.push(gltfLoader.load("./models/SCIFI/monsters/infected_female/InfectedFemale.gltf"));
    gltfCharacterPromises.push(gltfLoader.load("./models/SCIFI/monsters/slicer_female/SlicerFemale.gltf"));

    // level model
    // const gltfPromiseLevel: Promise<GltfAsset> = gltfLoader.load("./models/SCIFI/testlevel/TestLevel.gltf");
    const gltfPromiseLevel: Promise<GltfAsset> = gltfLoader.load("./models/SCIFI/level_1/robot_maintance_area.gltf");
    console.log("loading skybox...");

    // load skybox textures
    /*
    const envmapUrls: string[] = [
        "./textures/skyboxes/ballroom/px.png",
        "./textures/skyboxes/ballroom/nx.png",
        "./textures/skyboxes/ballroom/py.png",
        "./textures/skyboxes/ballroom/ny.png",
        "./textures/skyboxes/ballroom/pz.png",
        "./textures/skyboxes/ballroom/nz.png",
    ];*/
    const envmapUrls: string[] = [
        "./textures/skyboxes/kloofendal_48d_partly_cloudy_2k/px.png",
        "./textures/skyboxes/kloofendal_48d_partly_cloudy_2k/nx.png",
        "./textures/skyboxes/kloofendal_48d_partly_cloudy_2k/py.png",
        "./textures/skyboxes/kloofendal_48d_partly_cloudy_2k/ny.png",
        "./textures/skyboxes/kloofendal_48d_partly_cloudy_2k/pz.png",
        "./textures/skyboxes/kloofendal_48d_partly_cloudy_2k/nz.png",
    ];
    const imagePromises: (Promise<HTMLImageElement|ImageData>)[] = [];

    for (let i = 0; i < 6; i++) {
        const imgPromise: Promise<HTMLImageElement|ImageData> = imageLoader.loadPromise(envmapUrls[i]);
        imagePromises.push(imgPromise);
    }

    const charactersPromise = Promise.all(gltfCharacterPromises);
    const imagesPromise = Promise.all(imagePromises);

    Promise.all([charactersPromise, gltfPromiseLevel, imagesPromise]).then((loaded) => {
        const skyboxTexture: TextureCube = new TextureCube();

        for (let i = 0; i < 6; i++) {
            skyboxTexture.images[i] = loaded[2][i];
        }

        skyboxTexture.componentType = GLDevice.gl.UNSIGNED_BYTE;
        skyboxTexture.format = GLDevice.gl.RGB;
        skyboxTexture.isHDR = false;
        skyboxTexture.depth = 1;
        skyboxTexture.width = skyboxTexture.images[0].width;
        skyboxTexture.height = skyboxTexture.images[0].height;
        skyboxTexture.mipLevels = 1;
        skyboxTexture.samplerState = new SamplerState(GLDevice.gl.CLAMP_TO_EDGE, GLDevice.gl.CLAMP_TO_EDGE);
        skyboxTexture.upload();
        scene.background = skyboxTexture;
        scene.backgroundIntensity = 1;
        scene.irradianceIntensity = 1;

        const builderFemale = new GLTFSceneBuilder();
        const constraintProcssor = new ConstraintProcessor();

        builderFemale.processConstraints = constraintProcssor.processConstraintsGltf;

        const animations: AnimationAction[] = [];

        const gltfAssets: Map<string, GltfAsset> = new Map<string, GltfAsset>();
        for (let i = 0; i < characterModelKeys.length; i++) {
            gltfAssets.set(characterModelKeys[i], loaded[0][i]);
        }

        if (addObjectsManually) {
            // test use prefabs to create character objects
            const playerPrefab: PlayerPrefab = new PlayerPrefab(gltfAssets, physicsWorld, scene, camera, textureLoader, playerPhysicsMtl);
            playerPrefab.showMature = showMature;
            playerPrefab.matureSkinUrl = "./models/SCIFI/heroes/cyberGirl/SkinBaseColor_NSFW.png";
            const gltfScenePlayer = playerPrefab.createGameObject("Player", {}, new vec3([0, 1.5, 0]), quat.identity.copyTo(), new vec3([1, 1, 1]));

            const infectedFemalePrefab: InfectedFemalePrefab = new InfectedFemalePrefab(gltfAssets, physicsWorld, scene, textureLoader, playerPhysicsMtl);
            infectedFemalePrefab.showMature = showMature;
            infectedFemalePrefab.matureSkinUrl = "./models/SCIFI/monsters/infected_female/SkinBaseColor_NSFW.png";
            infectedFemalePrefab.createGameObject("InfectedFemale01", {}, new vec3([0, 1.5, -2.0]), quat.identity.copyTo(), new vec3([1, 1, 1]));
            infectedFemalePrefab.createGameObject("InfectedFemale02", {}, new vec3([0, 1.5, -4.0]), quat.identity.copyTo(), new vec3([1, 1, 1]));
            infectedFemalePrefab.createGameObject("InfectedFemale03", {}, new vec3([0, 1.5, -6.0]), quat.identity.copyTo(), new vec3([1, 1, 1]));
            infectedFemalePrefab.createGameObject("InfectedFemale04", {}, new vec3([0, 1.5, -8.0]), quat.identity.copyTo(), new vec3([1, 1, 1]));

            tpsBehavior = gltfScenePlayer.getBehaviorByTypeName("TPSPlayerBehavior") as TPSPlayerBehavior;
        }

        // build test level
        const builderLevel = new GLTFSceneBuilder();

        if (!addObjectsManually) {
            // put player and monster prefabs in level in blender and export gltf
            const gameObjectCreator: SciFiGameObjCreator = new SciFiGameObjCreator(physicsWorld, playerPhysicsMtl, groundPhysicsMtl, widgetPhysicsMtl, camera, scene, textureLoader);
            gameObjectCreator.gltfAssets = gltfAssets;
            gameObjectCreator.showMature = showMature;

            // physics world and material
            builderLevel.gameObjectCreator = gameObjectCreator;
        }

        builderLevel.physicsWorld = physicsWorld;
        builderLevel.defaultPhysicsMaterial = groundPhysicsMtl;

        builderLevel.lightIntensityRate = 1;
        
        const gltfSceneLevel = builderLevel.build(loaded[1], 0, undefined, true);
        gltfSceneLevel.name = "Level";
        gltfSceneLevel.autoUpdateTransform = false;
        scene.attachChild(gltfSceneLevel);
        prepareGLTFLevel(gltfSceneLevel);
        // update once for static objects
        scene.updateLocalTransform(true, true);
        scene.updateWorldTransform(false, true);
        InstancedMesh.updateInstancedMeshes(gltfSceneLevel);

        if (!addObjectsManually) {
            const playerObject = scene.getChildByName("Player");
            if (playerObject !== null) {
                tpsBehavior = playerObject.getBehaviorByTypeName("TPSPlayerBehavior") as TPSPlayerBehavior;
            } else {
                throw new Error("Player not found");
            }
        }

        console.log("start game loop...");

        Clock.instance.start();

        scene.start();

        requestAnimationFrame(gameLoop);

    });

    function pointerLockChange() {
        if (document.pointerLockElement === canvas) {
            if (tpsBehavior !== undefined) tpsBehavior.pointerLock = true;
        } else {
            if (tpsBehavior !== undefined) tpsBehavior.pointerLock = false;
        }
    }

    function gameLoop(now: number) {
        if (!skipThisFrame || !halfFPSMode) {
            Clock.instance.update(now);
            physicsWorld.step();

            // fix me: handle last frame picking queries before or after scene update?
            renderer.objectTagRenderer.processQueries();

            scene.update();

            renderer.render(scene);

            if (now - lastUpdateFPSTime > 1000) {
                infoPanel.innerHTML = curFPS.toString();
                lastUpdateFPSTime = now;
                curFPS = 0;
            }

            curFPS++;
        }
        skipThisFrame = !skipThisFrame;

        requestAnimationFrame(gameLoop);
    }

    function prepareGLTFLevel(gltfNode: Object3D) {
        gltfNode.isStatic = true;
        gltfNode.autoUpdateTransform = false;
        gltfNode.updateLocalTransform(true, false);

        if (gltfNode instanceof Mesh) {
            gltfNode.castShadow = true;
            gltfNode.receiveShadow = true;
            // gltfNode.boundingSphereRenderMode = BoundingRenderModes.normal;
        } else if (gltfNode instanceof EnvironmentProbe) {
            const envProbe = gltfNode as EnvironmentProbe;
            // envProbe.debugDraw = true;
        }

        for (const child of gltfNode.children) {
            prepareGLTFLevel(child);
        }
    }
}

function addTestDynamicObjects(physicsWorld: PhysicsWorld, widgetPhysicsMtl: CANNON.Material, scene: Scene, groundPhysicsMtl: CANNON.Material) {
    {
        const boxMesh = new Mesh();
        boxMesh.name = "box01";
        boxMesh.category = ObjectCategory.DANGER_ITEMS;
        boxMesh.geometry = new BoxGeometry(0.25, 0.25, 0.25);
        boxMesh.castShadow = true;
        boxMesh.isStatic = false;
        boxMesh.autoUpdateTransform = true;
        boxMesh.translation.setComponents(-1, 1, -1);
        // boxMesh.localTransform.fromTranslation(new vec3([0, 0, -5]));
        const boxMtl = new StandardPBRMaterial();
        boxMtl.color = new vec4([1.0, 1.0, 0.0, 1.0]);
        boxMtl.metallic = 0.8;
        boxMtl.roughness = 0.4;
        boxMesh.materials.push(boxMtl);

        // physics
        const boxBody = new RigidBody(boxMesh, physicsWorld, { mass: 0.2, material: widgetPhysicsMtl, collisionFilterGroup: 2, collisionFilterMask: 3 });
        physicsWorld.world.addBody(boxBody.body);
        boxMesh.behaviors.push(boxBody);

        boxBody.setPosition(boxMesh.translation);
        boxBody.setRotation(boxMesh.rotation);

        const boxShape = new CANNON.Box(new CANNON.Vec3(0.125, 0.125, 0.125));
        boxBody.body.addShape(boxShape);

        // auto rotate
        // const boxAutoRot = new AutoRotateBehavior(boxMesh);
        // boxMesh.behaviors.push(boxAutoRot);
        scene.attachChild(boxMesh);
    }
    // dynamic sphere small
    {
        const sphereMesh = new Mesh();
        sphereMesh.category = ObjectCategory.INTERACTIVE;
        sphereMesh.name = "sphere.Dynamic";
        // sphereMesh.localTransform.fromTranslation(new vec3([0, 0, 0.75]));
        sphereMesh.geometry = new SphereGeometry(0.2, 16, 8);
        sphereMesh.castShadow = true;
        sphereMesh.isStatic = false;
        sphereMesh.autoUpdateTransform = true;
        sphereMesh.translation.setComponents(0, 1, 0.75);
        const sphereMtl = new StandardPBRMaterial();
        sphereMtl.color = new vec4([1.0, 1.0, 1.0, 1.0]);
        sphereMtl.metallic = 0.9;
        sphereMtl.roughness = 0.5;
        sphereMtl.subsurface = 0.15;
        sphereMtl.subsurfaceColor = new vec3([0.4, 0.06, 0.0]);
        sphereMesh.materials.push(sphereMtl);

        scene.attachChild(sphereMesh);

        // physics
        const sphereBody = new RigidBody(sphereMesh, physicsWorld, { mass: 0.4, material: widgetPhysicsMtl, collisionFilterGroup: 2, collisionFilterMask: 3 });
        physicsWorld.world.addBody(sphereBody.body);
        sphereMesh.behaviors.push(sphereBody);
        sphereBody.setPosition(sphereMesh.translation);

        const sphereShape = new CANNON.Sphere(0.2);
        sphereBody.body.addShape(sphereShape);
    }

    // dynamic sphere big
    {
        const sphereMesh = new Mesh();
        sphereMesh.category = ObjectCategory.LOCKED;
        sphereMesh.name = "sphere.Static";
        // sphereMesh.localTransform.fromTranslation(new vec3([-0.75, -1.2, 0]));
        sphereMesh.geometry = new SphereGeometry(0.4, 16, 8);
        sphereMesh.castShadow = true;
        sphereMesh.isStatic = false;
        sphereMesh.autoUpdateTransform = true;
        sphereMesh.translation.setComponents(-0.75, 1, 0);
        const sphereMtl = new StandardPBRMaterial();
        sphereMtl.color = new vec4([1.0, 1.0, 1.0, 1.0]);
        sphereMtl.metallic = 0.05;
        sphereMtl.roughness = 0.95;
        sphereMesh.materials.push(sphereMtl);

        scene.attachChild(sphereMesh);

        // physics
        const sphereBody = new RigidBody(sphereMesh, physicsWorld, { mass: 0.6, material: widgetPhysicsMtl, collisionFilterGroup: 2, collisionFilterMask: 3 });
        physicsWorld.world.addBody(sphereBody.body);
        sphereMesh.behaviors.push(sphereBody);
        sphereBody.setPosition(sphereMesh.translation);

        const sphereShape = new CANNON.Sphere(0.4);
        sphereBody.body.addShape(sphereShape);
    }

    // modified: load gltf level to load lights and static scene
    return;
}

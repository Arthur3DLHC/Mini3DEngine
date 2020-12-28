import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock, SphereGeometry, CylinderGeometry, PlaneGeometry, PointLight, SpotLight, DirectionalLight, DirectionalLightShadow, EnvironmentProbe, SRTTransform, LoadingManager, TextureLoader, Texture, Texture2D, TextureCube, ImageLoader, SamplerState, EnvironmentProbeType, PhysicsWorld, RigidBody, GltfAsset, GLTFLoader, GLTFSceneBuilder, AnimationAction, Object3D, ActionControlBehavior, AnimationLayer, ActionStateMachine, ActionStateSingleAnim, ActionTransition, ActionCondition, ActionStateBlendTree, AnimationBlendNode, BlendMethods, SingleParamCondition, TimeUpCondition, AnimationMask, SkinMesh, AnimationLoopMode, InstancedMesh, SilhouetteSelectMode } from "../../src/mini3DEngine.js";
import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";
import { LookatBehavior } from "../common/behaviors/lookatBehavior.js";
import { SceneHelper } from "../common/sceneHelper.js";
import quat from "../../lib/tsm/quat.js";
import { ThirdPersonCtrlBehavior } from "../common/behaviors/thirdPersonCtrlBehavior.js";
import { ThirdPersonShooterBehavior } from "./thirdPersonShooterBehavior.js";
import vec2 from "../../lib/tsm/vec2.js";

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

    // todo: keep crosshair at center of canvas
    // todo: show / hide crosshair?
    const crosshair = document.getElementById("crosshair") as HTMLCanvasElement;
    crosshair.style.left = ((canvas.width - 4) / 2).toString();
    crosshair.style.top = ((canvas.height - 4) / 2).toString(); 

    let tpsBehavior: ThirdPersonShooterBehavior | null = null;

    const infoPanel: HTMLDivElement = document.getElementById("infoPanel") as HTMLDivElement;

    let lastUpdateFPSTime = 0;
    let curFPS = 0;

    /** save notebook GPU */
    const halfFPSMode = true;

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
    // renderer.postprocessor.silhouette.maxDistance = 3.0;
    renderer.postprocessor.silhouette.width = 2.0;
    renderer.postprocessor.silhouette.selectMode = SilhouetteSelectMode.ByCursor;
    renderer.postprocessor.silhouette.cursor = new vec2([canvas.width / 2, canvas.height / 2]);
    renderer.postprocessor.silhouette.setSilhouetteColor(1, new vec4([1, 0, 0, 1]));
    renderer.postprocessor.silhouette.setSilhouetteColor(2, new vec4([0, 1, 0, 1]));
    renderer.postprocessor.silhouette.setSilhouetteColor(3, new vec4([0, 0, 1, 1]));

    const scene = new Scene();
    const camera = new PerspectiveCamera();
    camera.aspect = canvas.width / canvas.height;
    camera.far = 30;
    // camera.localTransform.fromTranslation(new vec3([0, 0, 2]));
    camera.autoUpdateTransform = true;

    scene.attachChild(camera);

    // add some objects to scene
    // test box geometry
    addTestDynamicObjects(physicsWorld, widgetPhysicsMtl, scene, addPlane, groundPhysicsMtl);

    console.log("loading gltf models...");
    // todo: load gltf character, load skybox
    const gltfPromiseFemale: Promise<GltfAsset> = gltfLoader.load("./models/SCIFI/heroes/cyberGirl/CyberGirl_animation.gltf");
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

    const imagesPromise = Promise.all(imagePromises);

    Promise.all([gltfPromiseFemale, gltfPromiseLevel, imagesPromise]).then((loaded) => {
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
        skyboxTexture.samplerState = new SamplerState();
        skyboxTexture.upload();
        scene.background = skyboxTexture;
        scene.backgroundIntensity = 1;
        scene.irradianceIntensity = 1;

        const builderFemale = new GLTFSceneBuilder();
        const animations: AnimationAction[] = [];

        const gltfSceneFemale = builderFemale.build(loaded[0], 0, animations);
        gltfSceneFemale.name = "Female";
        gltfSceneFemale.autoUpdateTransform = true;
        gltfSceneFemale.translation.y = 1.5;  // for robot maintance area level
        scene.attachChild(gltfSceneFemale);

        prepareGLTFCharacter(gltfSceneFemale);

        if (showMature) {
            setMatureSkinForCharacter(gltfSceneFemale);
        }

        // and add rigid body for player character
        // use a compound shape from two spheres
        // fixed rotation
        const playerBody = new RigidBody(gltfSceneFemale, physicsWorld, { mass: 5, material: playerPhysicsMtl });
        physicsWorld.world.addBody(playerBody.body);

        // add rigid body last? after third person control
        gltfSceneFemale.behaviors.push(playerBody);

        playerBody.body.fixedRotation = true;
        playerBody.affectRotation = false;

        playerBody.setPosition(gltfSceneFemale.translation);
        playerBody.setRotation(gltfSceneFemale.rotation);

        // cannon does not have capsule shape, so use some spheres...
        const playerShapeLow = new CANNON.Sphere(0.3);
        const playerShapeMedium = new CANNON.Sphere(0.3);
        const playerShapeHigh = new CANNON.Sphere(0.3);

        // playerBody.body.addShape(playerShapeLow, new CANNON.Vec3(0, -0.55, 0));
        // playerBody.body.addShape(playerShapeMedium, new CANNON.Vec3(0, 0, 0));
        // playerBody.body.addShape(playerShapeHigh, new CANNON.Vec3(0, 0.55, 0));

        // NOTE: if use a animated character model load from gltf, the offsets should be:

        playerBody.body.addShape(playerShapeLow, new CANNON.Vec3(0, 0.3, 0));
        playerBody.body.addShape(playerShapeMedium, new CANNON.Vec3(0, 0.85, 0));
        playerBody.body.addShape(playerShapeHigh, new CANNON.Vec3(0, 1.4, 0));

        const actionCtrlBehavior = new ActionControlBehavior(gltfSceneFemale, animations);

        // first person view controller
        // todo: use third person controller
        tpsBehavior = new ThirdPersonShooterBehavior(gltfSceneFemale, playerBody, camera, actionCtrlBehavior);
        gltfSceneFemale.behaviors.push(tpsBehavior);
        tpsBehavior.cameraVerticalOffset = 1.5;
        tpsBehavior.cameraHorizontalOffset = new vec3([0.4, 0, 1.5]);
        tpsBehavior.cameraHorizontalOffsetScale = 0.5;
        tpsBehavior.moveSpeed = 2;
        tpsBehavior.aimMoveSpeed = 0.6;
        tpsBehavior.pointerLock = false;
        
        // todo: create animation control behavior
        // animation layer, state machine (manually / json)
        // addActionControl(gltfSceneFemale, animations, actionCtrlBehavior);
        addActionControlJSON(gltfSceneFemale, animations, actionCtrlBehavior);

        tpsBehavior.upperBodyLayer = actionCtrlBehavior.animationLayers.find((layer)=>{return layer.name === "upperBody";});

        // build test level
        const builderLevel = new GLTFSceneBuilder();
        // physics world and material
        builderLevel.physicsWorld = physicsWorld;
        builderLevel.defaultPhysicsMaterial = groundPhysicsMtl;

        const gltfSceneLevel = builderLevel.build(loaded[1], 0, undefined, true);
        gltfSceneLevel.name = "Level";
        gltfSceneLevel.autoUpdateTransform = false;
        scene.attachChild(gltfSceneLevel);
        prepareGLTFLevel(gltfSceneLevel);
        // update once for static objects
        scene.updateWorldTransform(false, true);
        InstancedMesh.updateInstancedMeshes(gltfSceneLevel);

        window.onmousedown = (ev: MouseEvent) => {
            // fpsBehavior.onMouseDown(ev);
            if (tpsBehavior !== null) tpsBehavior.onMouseDown(ev);
        }

        window.onmouseup = (ev: MouseEvent) => {
            // fpsBehavior.onMouseUp(ev);
            if (tpsBehavior !== null) tpsBehavior.onMouseUp(ev);
        }

        window.onmousemove = (ev: MouseEvent) => {
            // fpsBehavior.onMouseMove(ev);
            if (tpsBehavior !== null) tpsBehavior.onMouseMove(ev);
        }

        window.onwheel = (ev: WheelEvent) => {
            ev.preventDefault();
            if (tpsBehavior !== null) tpsBehavior.onMouseWheel(ev);
        }

        window.onkeydown = (ev: KeyboardEvent) => {
            // fpsBehavior.onKeyDown(ev);
            if (tpsBehavior !== null) tpsBehavior.onKeyDown(ev);
        }

        window.onkeyup = (ev: KeyboardEvent) => {
            // fpsBehavior.onKeyUp(ev);
            if (tpsBehavior !== null) tpsBehavior.onKeyUp(ev);
        }

        console.log("start game loop...");

        Clock.instance.start();
        requestAnimationFrame(gameLoop);

    });

    function pointerLockChange() {
        if (document.pointerLockElement === canvas) {
            if (tpsBehavior !== null) tpsBehavior.pointerLock = true;
        } else {
            if (tpsBehavior !== null) tpsBehavior.pointerLock = false;
        }
    }

    function gameLoop(now: number) {
        if (!skipThisFrame || !halfFPSMode) {
            Clock.instance.update(now);
            physicsWorld.step();
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
        }
        skipThisFrame = !skipThisFrame;

        requestAnimationFrame(gameLoop);
    }

    function addPlane(name: string, width: number, height: number, position: vec3, rotation: quat, wallColor: vec4, metallic: number, roughness: number, scene: Scene, world: PhysicsWorld, physicsMtl: CANNON.Material, textureUrl?:string) {
        const planeMesh = new Mesh();
        planeMesh.name = name;
        // mat4.product(matPlaneTran, matPlaneRot, planeMesh.localTransform);
        planeMesh.geometry = new PlaneGeometry(width, height, 1, 1);
        planeMesh.castShadow = true;
        planeMesh.isStatic = true;
        planeMesh.translation = position;
        planeMesh.rotation = rotation;
        planeMesh.autoUpdateTransform = true;
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

        // physics plane
        const planeShape = new CANNON.Plane();
        // planeShape.worldNormal.set(0, 1, 0);
        const planeBody = new RigidBody(planeMesh, physicsWorld, { mass:0, material: physicsMtl });
        
        // todo: set position, rotations
        planeBody.setPosition(position);
        // planeBody.setRotation(rotation);
        planeBody.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);

        planeMesh.behaviors.push(planeBody);
        planeBody.body.addShape(planeShape);
        physicsWorld.world.addBody(planeBody.body);
    }

    function prepareGLTFCharacter(gltfNode: Object3D) {
        // gltfNode.isStatic = true;
        gltfNode.isStatic = false;
        gltfNode.autoUpdateTransform = true;
        
        if (gltfNode instanceof Mesh) {
            gltfNode.castShadow = true;
            gltfNode.receiveShadow = true;
            // gltfNode.boundingSphereRenderMode = BoundingRenderModes.normal;
        }

        for (const child of gltfNode.children) {
            prepareGLTFCharacter(child);
        }
    }

    function setMatureSkinForCharacter(gltfNode: Object3D) {
        if (gltfNode instanceof Mesh) {
            const mesh = gltfNode as Mesh;
            const skinMtl = mesh.materials.find((mtl)=>{return mtl.name === "Material.Skin.001"});
            if (skinMtl !== undefined && skinMtl instanceof StandardPBRMaterial) {
                const pbrSkinMtl = skinMtl as StandardPBRMaterial;
                // load texture?
                const texturePromise: Promise<Texture> = textureLoader.loadPromise("./models/SCIFI/heroes/cyberGirl/SkinBaseColor_NSFW.png");
                texturePromise.then((skinTex) => {
                    pbrSkinMtl.colorMap = skinTex;
                });
                return;
            }
        }

        for (const child of gltfNode.children) {
            setMatureSkinForCharacter(child);
        }
    }

    function prepareGLTFLevel(gltfNode: Object3D) {
        gltfNode.isStatic = true;
        gltfNode.autoUpdateTransform = false;
        gltfNode.updateLocalTransform();

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

    function addActionControl(actor: Object3D, animations: AnimationAction[], actionCtrlBehavior: ActionControlBehavior)  {
        actor.behaviors.push(actionCtrlBehavior);

        // 0 - not aiming; 1 - aiming
        actionCtrlBehavior.actionParams.set("aiming", 0.0);
        // -1 - aim down; 0 - aim strait; 1 - aim up
        actionCtrlBehavior.actionParams.set("aimPitch", 0.0);
        // -1 - move backward (aiming only); 0 - idle; 1 - move forward
        actionCtrlBehavior.actionParams.set("moveSpeed", 0.0);
        // 0 - not shooting; 1 - shooting
        actionCtrlBehavior.actionParams.set("shoot", 0.0);

        const baseLayer = new AnimationLayer();
        actionCtrlBehavior.animationLayers.push(baseLayer);
        baseLayer.name = "baseLayer";
        baseLayer.blendWeight = 1;

        // state machine
        baseLayer.stateMachine = new ActionStateMachine(actionCtrlBehavior, baseLayer);

        // use only 1 blendtree?
        const blendTree = new ActionStateBlendTree("tpsTree", baseLayer.stateMachine);
        baseLayer.stateMachine.addState(blendTree);

        // root node
        //      |- aiming
        //      |   |- aiming idle
        //      |   |- aiming move forward
        //      |   |- aiming move backward
        //      |
        //      |- not aiming
        //          |- idle
        //          |- walk
        //          |- jog
        blendTree.rootNode = new AnimationBlendNode(blendTree, ["aiming"], BlendMethods.Simple1D, undefined, 1);

        // aiming == 1
        const aimingNode = new AnimationBlendNode(blendTree, ["moveSpeed"], BlendMethods.Simple1D, [1], 0);
        blendTree.rootNode.addChild(aimingNode);
        
        // moveSpeed == -1
        const aimingBackwardNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [-1], 0, getAnimationByName(animations, "Female.Aim.Walk.Backward"));
        aimingNode.addChild(aimingBackwardNode);

        // moveSpeed == 0
        const aimingIdleNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [0], 1,  getAnimationByName(animations, "Female.Aim.Middle"));
        aimingNode.addChild(aimingIdleNode);

        // moveSpeed == 1
        const aimingForwardNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [1], 0, getAnimationByName(animations, "Female.Aim.Walk.Forward"));
        aimingNode.addChild(aimingForwardNode);

        // aiming == 0
        const notAimingNode = new AnimationBlendNode(blendTree, ["moveSpeed"], BlendMethods.Simple1D, [0], 1);
        blendTree.rootNode.addChild(notAimingNode);

        // moveSpeed == 0
        const idleNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [0], 1, getAnimationByName(animations, "Female.Idle"));
        notAimingNode.addChild(idleNode);

        // moveSpeed == 0.5
        // const walkNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [0.5], 0, getAnimationByName(animations, "Female.Walk"));
        // notAimingNode.addChild(walkNode);

        // moveSpeed == 1
        const jogNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [1], 0, getAnimationByName(animations, "Female.Jog"));
        notAimingNode.addChild(jogNode);

        baseLayer.stateMachine.curState = blendTree;

        /*
        // not aiming state
        const move = new ActionStateSingleAnim("idle", baseLayer.stateMachine);
        baseLayer.stateMachine.addState(move);
        move.animation = getAnimationByName(animations, "Female.Idle");
        
        const idle_aim = new ActionTransition(move);
        move.transitions.push(idle_aim);

        // aim state (a blend tree?)
        */

        const upperBodyLayer = new AnimationLayer();
        actionCtrlBehavior.animationLayers.push(upperBodyLayer);
        upperBodyLayer.name = "upperBody";
        upperBodyLayer.blendWeight = 0;

        // mask
        upperBodyLayer.mask = new AnimationMask();

        let maskRootName = "spine.001";
        let upperBodyRootJoint = actor.getChildByName(maskRootName, true);
        if (upperBodyRootJoint === null) {
            throw new Error("Mask root joint not found: " + maskRootName);
        }
        addJointHierarchyToLayerMask(upperBodyRootJoint, upperBodyLayer.mask);

        // for the convenience of making rig animation,
        // the parent of spine.002 is spine.IK, not spine.001. It use a copylocatoin constraint to spine.001 instead.
        // so here we need to add spine.IK and all it's children to the mask too
        maskRootName = "spine.IK";
        upperBodyRootJoint = actor.getChildByName(maskRootName, true);
        if (upperBodyRootJoint === null) {
            throw new Error("Mask root joint not found: " + maskRootName);
        }
        addJointHierarchyToLayerMask(upperBodyRootJoint, upperBodyLayer.mask);

        // state machine
        upperBodyLayer.stateMachine = new ActionStateMachine(actionCtrlBehavior, upperBodyLayer);

        // 2 states
        // aim state (blend tree)
        const aimBlendTree = new ActionStateBlendTree("upperAimTree", upperBodyLayer.stateMachine);
        upperBodyLayer.stateMachine.addState(aimBlendTree);

        // root node
        //      | -aim down
        //      | -aim straight
        //      | -aim up
        aimBlendTree.rootNode = new AnimationBlendNode(aimBlendTree, ["aimPitch"], BlendMethods.Simple1D, undefined, 1);

        // aimPitch == -1
        const aimDownNode = new AnimationBlendNode(aimBlendTree, undefined, BlendMethods.Direct, [-1], 0, getAnimationByName(animations, "Female.Aim.Down"));
        aimBlendTree.rootNode.addChild(aimDownNode);

        // aimPitch == 0
        const aimStraightNode = new AnimationBlendNode(aimBlendTree, undefined, BlendMethods.Direct, [0], 1, getAnimationByName(animations, "Female.Aim.Middle"));
        aimBlendTree.rootNode.addChild(aimStraightNode);

        // aimPitch == 1
        const aimUpNode = new AnimationBlendNode(aimBlendTree, undefined, BlendMethods.Direct, [1], 0, getAnimationByName(animations, "Female.Aim.Up"));
        aimBlendTree.rootNode.addChild(aimUpNode);

        // shoot state (blend tree)
        const shootBlendTree = new ActionStateBlendTree("upperShootTree", upperBodyLayer.stateMachine);
        upperBodyLayer.stateMachine.addState(shootBlendTree);

        // fix me: model animations not done
        // root node
        //      | -shoot down
        //      | -shoot straight
        //      | -shoot up

        shootBlendTree.rootNode = new AnimationBlendNode(shootBlendTree, ["aimPitch"], BlendMethods.Simple1D, undefined, 0);

        // aimPitch == -1
        let shootAnim = getAnimationByName(animations, "Female.Shoot.Down");
        shootAnim.LoopMode = AnimationLoopMode.Once;
        const shootDownNode = new AnimationBlendNode(shootBlendTree, undefined, BlendMethods.Direct, [-1], 0, shootAnim);
        shootBlendTree.rootNode.addChild(shootDownNode);

        // aimPitch == 0
        shootAnim = getAnimationByName(animations, "Female.Shoot.Middle");
        shootAnim.LoopMode = AnimationLoopMode.Once;
        const shootStraitNode = new AnimationBlendNode(shootBlendTree, undefined, BlendMethods.Direct, [0], 1, shootAnim);
        shootBlendTree.rootNode.addChild(shootStraitNode);

        // aimPitch == 1
        shootAnim = getAnimationByName(animations, "Female.Shoot.Up");
        shootAnim.LoopMode = AnimationLoopMode.Once;
        const shootUpNode = new AnimationBlendNode(shootBlendTree, undefined, BlendMethods.Direct, [1], 0, shootAnim);
        shootBlendTree.rootNode.addChild(shootUpNode);

        // the weight of this layer will be zero in other states

        // todo: state transitions and conditions
        // add a general condition class?
        // evaluate condition according to the params on actionControlBehavior?

        // aim to shoot
        // use SingleParamCondition
        const aim_shoot = new ActionTransition(aimBlendTree);
        aimBlendTree.transitions.push(aim_shoot);
        aim_shoot.targetState = shootBlendTree;
        aim_shoot.conditions.push(new SingleParamCondition(actionCtrlBehavior, "shoot", "===", 1));

        // shoot to aim (timeup?)
        const shoot_aim = new ActionTransition(shootBlendTree);
        shootBlendTree.transitions.push(shoot_aim);
        shoot_aim.targetState = aimBlendTree;
        shoot_aim.conditions.push(new TimeUpCondition(0.5));

        upperBodyLayer.stateMachine.curState = aimBlendTree;

        return actionCtrlBehavior;
    }

    function addActionControlJSON(actor: Object3D, animations: AnimationAction[], actionCtrlBehavior: ActionControlBehavior) {
        actor.behaviors.push(actionCtrlBehavior);

        const actionCtrlDef: any = {
            "actionParams": {
                "aiming": 0,
                "aimPitch": 0,
                "moveSpeed": 0,
                "strafeSpeed": 0,
                "shoot": 0,
                "gotHit": 0,
                "down": 0,
            },
            "animationLayers": [
                {
                    "name": "baseLayer",
                    "blendWeight": 1,
                    "blendMode": 1,
                    "stateMachine": {
                        "curState": "tpsTree",
                        "states": [
                            {
                                "typeStr": "blendTree",
                                "name": "tpsTree",
                                "rootNode": {
                                    "blendParameters": ["aiming"],
                                    "blendMethod": 0,
                                    "weight": 1,
                                    "children": [
                                        /*
                                        {
                                            // aiming move (front back only)
                                            "blendParameters": ["moveSpeed"],
                                            "blendMethod": 0,
                                            "weigth": 0,
                                            "weightParamPosition": [1],
                                            "children": [
                                                {
                                                    // aim move backward
                                                    "blendMethod": 4,
                                                    "weigth": 0,
                                                    "weightParamPosition": [-1],
                                                    "animation": "Female.Aim.Walk.Backward"
                                                },
                                                {
                                                    // aim stand
                                                    "blendMethod": 4,
                                                    "weigth": 1,
                                                    "weightParamPosition": [0],
                                                    "animation": "Female.Aim.Middle"
                                                },
                                                {
                                                    // aim move forward
                                                    "blendMethod": 4,
                                                    "weigth": 0,
                                                    "weightParamPosition": [1],
                                                    "animation": "Female.Aim.Walk.Forward"
                                                },
                                            ]
                                        },
                                        */
                                        {
                                            // aiming move (directional)
                                            "blendParameters": ["strafeSpeed", "moveSpeed"],
                                            "blendMethod": 1,
                                            "weigth": 0,
                                            "weightParamPosition": [1], // aiming === 1
                                            "children": [
                                                {
                                                    // aim move backward
                                                    "blendMethod": 4,
                                                    "weigth": 0,
                                                    "weightParamPosition": [0, -1],
                                                    "animation": "Female.Aim.Walk.Backward"
                                                },
                                                {
                                                    // aim stand
                                                    "blendMethod": 4,
                                                    "weigth": 1,
                                                    "weightParamPosition": [0, 0],
                                                    "animation": "Female.Aim.Middle"
                                                },
                                                {
                                                    // aim move forward
                                                    "blendMethod": 4,
                                                    "weigth": 0,
                                                    "weightParamPosition": [0, 1],
                                                    "animation": "Female.Aim.Walk.Forward"
                                                },
                                                {
                                                    // aim strafe left
                                                    "blendMethod": 4,
                                                    "weigth": 0,
                                                    "weightParamPosition": [-1, 0],
                                                    "animation": "Female.Aim.Walk.Left"
                                                },
                                                {
                                                    // aim strafe right
                                                    "blendMethod": 4,
                                                    "weigth": 0,
                                                    "weightParamPosition": [1, 0],
                                                    "animation": "Female.Aim.Walk.Right"
                                                },
                                            ]
                                        },
                                        {
                                            // not aiming
                                            "blendParameters": ["moveSpeed"],
                                            "blendMethod": 0,
                                            "weigth": 1,
                                            "weightParamPosition": [0],
                                            "children": [
                                                {
                                                    // idle
                                                    "blendMethod": 4,
                                                    "weigth": 1,
                                                    "weightParamPosition": [0],
                                                    "animation": "Female.Idle"
                                                },
                                                {
                                                    // jog
                                                    "blendMethod": 4,
                                                    "weigth": 0,
                                                    "weightParamPosition": [1],
                                                    "animation": "Female.Jog"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "upperBody",
                    "blendWeight": 0,
                    "blendMode": 1,
                    "mask": {
                        "joints": [
                            {
                                // "path": "spine.001",
                                "name": "spine.001",
                                "recursive": true,
                            },
                            {
                                // "path": "spine.IK",
                                "name": "spine.IK",
                                "recursive": true,
                            }
                        ]
                    },
                    "stateMachine": {
                        "curState": "upperAimTree",
                        "states": [
                            {
                                "typeStr": "blendTree",
                                "name": "upperAimTree",
                                "transitions": [
                                    {
                                        "target": "upperShootTree",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "shoot",
                                                "compareOp": "===",
                                                "compareValue": 1
                                            }
                                        ]
                                    }
                                ],
                                "rootNode": {
                                    "blendParameters": ["aimPitch"],
                                    "blendMethod": 0,
                                    "weight": 1,
                                    "children": [
                                        {
                                            // aim down
                                            "blendMethod": 4,
                                            "weigth": 0,
                                            "weightParamPosition": [-1],
                                            "animation": "Female.Aim.Down"
                                        },
                                        {
                                            // aim middle
                                            "blendMethod": 4,
                                            "weigth": 1,
                                            "weightParamPosition": [0],
                                            "animation": "Female.Aim.Middle"
                                        },
                                        {
                                            // aim up
                                            "blendMethod": 4,
                                            "weigth": 0,
                                            "weightParamPosition": [1],
                                            "animation": "Female.Aim.Up"
                                        }
                                    ]
                                }
                            },
                            {
                                "typeStr": "blendTree",
                                "name": "upperShootTree",
                                "transitions": [
                                    {
                                        "target": "upperAimTree",
                                        "conditions": [
                                            {
                                                "typeStr": "timeUp",
                                                "duration": 0.5,
                                            }
                                        ]
                                    }
                                ],
                                "rootNode": {
                                    "blendParameters": ["aimPitch"],
                                    "blendMethod": 0,
                                    "weight": 1,
                                    "children": [
                                        {
                                            // shoot down
                                            "blendMethod": 4,
                                            "weigth": 0,
                                            "weightParamPosition": [-1],
                                            "animation": "Female.Shoot.Down",
                                            "animLoopMode": 0
                                        },
                                        {
                                            // shoot middle
                                            "blendMethod": 4,
                                            "weigth": 1,
                                            "weightParamPosition": [0],
                                            "animation": "Female.Shoot.Middle",
                                            "animLoopMode": 0
                                        },
                                        {
                                            // shoot up
                                            "blendMethod": 4,
                                            "weigth": 0,
                                            "weightParamPosition": [1],
                                            "animation": "Female.Shoot.Up",
                                            "animLoopMode": 0
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        };

        actionCtrlBehavior.fromJSON(actionCtrlDef);
    }
}

function addJointHierarchyToLayerMask(rootJoint: Object3D, mask: AnimationMask) {
    mask.joints.push(rootJoint);
    for (const child of rootJoint.children) {
        addJointHierarchyToLayerMask(child, mask);
    }
}

function getAnimationByName(animations: AnimationAction[], animName: string) {
    const anim = animations.find((anim: AnimationAction) => { return anim.name === animName; });
    if (anim === undefined) {
        throw new Error("Animation not found: " + animName);
    }
    return anim;
}

function addTestDynamicObjects(physicsWorld: PhysicsWorld, widgetPhysicsMtl: CANNON.Material, scene: Scene, addPlane: (name: string, width: number, height: number, position: vec3, rotation: quat, wallColor: vec4, metallic: number, roughness: number, scene: Scene, world: PhysicsWorld, physicsMtl: CANNON.Material, textureUrl?: string | undefined) => void, groundPhysicsMtl: CANNON.Material) {
    {
        const boxMesh = new Mesh();
        boxMesh.name = "box01";
        boxMesh.category = 1;
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
        const boxBody = new RigidBody(boxMesh, physicsWorld, { mass: 0.2, material: widgetPhysicsMtl });
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
        sphereMesh.category = 2;
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
        const sphereBody = new RigidBody(sphereMesh, physicsWorld, { mass: 0.4, material: widgetPhysicsMtl });
        physicsWorld.world.addBody(sphereBody.body);
        sphereMesh.behaviors.push(sphereBody);
        sphereBody.setPosition(sphereMesh.translation);

        const sphereShape = new CANNON.Sphere(0.2);
        sphereBody.body.addShape(sphereShape);
    }

    // dynamic sphere big
    {
        const sphereMesh = new Mesh();
        sphereMesh.category = 3;
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
        const sphereBody = new RigidBody(sphereMesh, physicsWorld, { mass: 0.6, material: widgetPhysicsMtl });
        physicsWorld.world.addBody(sphereBody.body);
        sphereMesh.behaviors.push(sphereBody);
        sphereBody.setPosition(sphereMesh.translation);

        const sphereShape = new CANNON.Sphere(0.4);
        sphereBody.body.addShape(sphereShape);
    }

    // modified: load gltf level to load lights and static scene
    return;

    // static cylinder
    {
        const cylinderMesh = new Mesh();
        cylinderMesh.name = "cylinder01";
        // cylinderMesh.localTransform.fromTranslation(new vec3([0.75, 0, 0]));
        cylinderMesh.geometry = new CylinderGeometry(0.25, 0.5, 24);
        cylinderMesh.castShadow = true;
        cylinderMesh.isStatic = true;
        cylinderMesh.autoUpdateTransform = true;
        cylinderMesh.translation.setComponents(0.75, 0.5, 0);
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

        // physics
        const cylinderBody = new RigidBody(cylinderMesh, physicsWorld, { mass: 0, material: widgetPhysicsMtl });
        physicsWorld.world.addBody(cylinderBody.body);
        cylinderMesh.behaviors.push(cylinderBody);
        cylinderBody.setPosition(cylinderMesh.translation);

        const cylinderShape = new CANNON.Cylinder(0.25, 0.25, 0.5, 12);
        cylinderBody.body.addShape(cylinderShape);
    }

    // ground plane
    {
        const planePosition = new vec3([0, 0, 0]);
        const planeRotation = quat.fromEuler(0, 0, 0, "ZXY");

        addPlane("floor", 40, 40, planePosition, planeRotation, new vec4([1.0, 1.0, 1.0, 1.0]), 0.5, 0.5, scene, physicsWorld, groundPhysicsMtl);
    }

    // add some lights and envprobes
    {
        const dirLight01 = new DirectionalLight();
        dirLight01.isStatic = true;
        dirLight01.autoUpdateTransform = false; // let the behaivor work
        dirLight01.on = true;
        dirLight01.color = new vec4([3, 3, 3, 1]);
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
        SceneHelper.addEnvProbe("envProbe01", 20, new vec3([0, 1, 0]), scene, EnvironmentProbeType.Reflection);
        SceneHelper.addEnvProbe("irrProbe01", 20, new vec3([0, 1, 0]), scene, EnvironmentProbeType.Irradiance);
    }
}

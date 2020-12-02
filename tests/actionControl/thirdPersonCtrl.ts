import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock, SphereGeometry, CylinderGeometry, PlaneGeometry, PointLight, SpotLight, DirectionalLight, DirectionalLightShadow, EnvironmentProbe, SRTTransform, LoadingManager, TextureLoader, Texture, Texture2D, TextureCube, ImageLoader, SamplerState, EnvironmentProbeType, PhysicsWorld, RigidBody, GltfAsset, GLTFLoader, GLTFSceneBuilder, AnimationAction, Object3D, ActionControlBehavior, AnimationLayer, ActionStateMachine, ActionStateSingleAnim, ActionTransition, ActionCondition, ActionStateBlendTree, AnimationBlendNode, BlendMethods, SingleParamCondition, TimeUpCondition, AnimationMask } from "../../src/mini3DEngine.js";
import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";
import { LookatBehavior } from "../common/behaviors/lookatBehavior.js";
import { SceneHelper } from "../common/sceneHelper.js";
import quat from "../../lib/tsm/quat.js";
import { ThirdPersonCtrlBehavior } from "../common/behaviors/thirdPersonCtrlBehavior.js";

window.onload = () => {
    const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
    if (!canvas) {
        console.error("Canvas not found");
        return;
    }

    GLDevice.initialize(canvas);

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
    const scene = new Scene();
    const camera = new PerspectiveCamera();
    camera.aspect = canvas.width / canvas.height;
    camera.far = 20;
    // camera.localTransform.fromTranslation(new vec3([0, 0, 2]));
    camera.autoUpdateTransform = true;

    scene.attachChild(camera);

    // add some objects to scene
    // test box geometry
    createScene(physicsWorld, widgetPhysicsMtl, scene, addPlane, groundPhysicsMtl);

    console.log("loading gltf model...");
    // todo: load gltf character, load skybox
    const gltfPromiseFemale: Promise<GltfAsset> = gltfLoader.load("./models/SCIFI/heroes/cyberGirl/CyberGirl_animation.gltf");

    console.log("loading skybox...");

    // load skybox textures
    const envmapUrls: string[] = [
        "./textures/skyboxes/ballroom/px.png",
        "./textures/skyboxes/ballroom/nx.png",
        "./textures/skyboxes/ballroom/py.png",
        "./textures/skyboxes/ballroom/ny.png",
        "./textures/skyboxes/ballroom/pz.png",
        "./textures/skyboxes/ballroom/nz.png",
    ];
    const imagePromises: (Promise<HTMLImageElement|ImageData>)[] = [];

    for (let i = 0; i < 6; i++) {
        const imgPromise: Promise<HTMLImageElement|ImageData> = imageLoader.loadPromise(envmapUrls[i]);
        imagePromises.push(imgPromise);
    }

    const imagesPromise = Promise.all(imagePromises);

    Promise.all([gltfPromiseFemale, imagesPromise]).then((loaded) => {
        const skyboxTexture: TextureCube = new TextureCube();

        for (let i = 0; i < 6; i++) {
            skyboxTexture.images[i] = loaded[1][i];
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
        scene.backgroundIntensity = 4;
        scene.irradianceIntensity = 30;

        const builderFemale = new GLTFSceneBuilder();
        const animations: AnimationAction[] = [];

        const gltfSceneFemale = builderFemale.build(loaded[0], 0, animations);
        gltfSceneFemale.name = "Female";
        gltfSceneFemale.autoUpdateTransform = true;
        scene.attachChild(gltfSceneFemale);

        prepareGLTFCharacter(gltfSceneFemale);

        /*
        const playerMesh = new Mesh();
        playerMesh.name = "player";
        playerMesh.geometry = new BoxGeometry(0.5, 1.7, 0.3);
        playerMesh.castShadow = true;
        playerMesh.isStatic = false;
        playerMesh.autoUpdateTransform = true;
        playerMesh.translation.setComponents(0, 1.5, 0);

        const playerMtl = new StandardPBRMaterial();
        playerMtl.color = new vec4([1, 1, 1, 1]);
        playerMtl.metallic = 0.02;
        playerMtl.roughness = 0.4;
        playerMesh.materials.push(playerMtl);

        scene.attachChild(playerMesh);
        */

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

        // first person view controller
        // todo: use third person controller
        const tpsBehavior = new ThirdPersonCtrlBehavior(gltfSceneFemale, playerBody, camera);
        gltfSceneFemale.behaviors.push(tpsBehavior);
        tpsBehavior.cameraVerticalOffset = 0.8;
        tpsBehavior.cameraHorizontalOffset = new vec3([0.5, 0, 1.5]);
        tpsBehavior.moveSpeed = 2;
        
        // todo: create animation control behavior
        // animation layer, state machine (manually / json)
        addActionControl(gltfSceneFemale, animations);

        window.onmousedown = (ev: MouseEvent) => {
            // fpsBehavior.onMouseDown(ev);
            tpsBehavior.onMouseDown(ev);
        }

        window.onmouseup = (ev: MouseEvent) => {
            // fpsBehavior.onMouseUp(ev);
            tpsBehavior.onMouseUp(ev);
        }

        window.onmousemove = (ev: MouseEvent) => {
            // fpsBehavior.onMouseMove(ev);
            tpsBehavior.onMouseMove(ev);
        }

        window.onkeydown = (ev: KeyboardEvent) => {
            // fpsBehavior.onKeyDown(ev);
            tpsBehavior.onKeyDown(ev);
        }

        window.onkeyup = (ev: KeyboardEvent) => {
            // fpsBehavior.onKeyUp(ev);
            tpsBehavior.onKeyUp(ev);
        }

        console.log("start game loop...");

        Clock.instance.start();
        requestAnimationFrame(gameLoop);
    });

    const infoPanel: HTMLDivElement = document.getElementById("infoPanel") as HTMLDivElement;

    let lastUpdateFPSTime = 0;
    let curFPS = 0;

    function gameLoop(now: number) {
        Clock.instance.update(now);
        physicsWorld.step();
        scene.updateBehavior();
        scene.updateWorldTransform(false, true);
        renderer.render(scene);

        if (now - lastUpdateFPSTime > 1000) {
            infoPanel.innerHTML = curFPS.toString();
            lastUpdateFPSTime = now;
            curFPS = 0;
        }

        curFPS++;

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

    function addActionControl(actor: Object3D, animations: AnimationAction[]) {
        const actionCtrlBehavior = new ActionControlBehavior(actor, animations);
        actor.behaviors.push(actionCtrlBehavior);

        // 0 - not aiming; 1 - aiming
        actionCtrlBehavior.actionParams.set("aiming", 0.0);
        // -1 - aim down; 0 - aim strait; 1 - aim up
        actionCtrlBehavior.actionParams.set("aimUpDown", 0.0);
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
        const aimingBackwardNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [-1], 1, getAnimationByName(animations, "Female.Aim.Walk.Backward"));
        aimingNode.addChild(aimingBackwardNode);

        // moveSpeed == 0
        const aimingIdleNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [0], 1,  getAnimationByName(animations, "Female.Aim.Middle"));
        aimingNode.addChild(aimingIdleNode);

        // moveSpeed == 1
        const aimingForwardNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [1], 1, getAnimationByName(animations, "Female.Aim.Walk.Forward"));
        aimingNode.addChild(aimingForwardNode);

        // aiming == 0
        const notAimingNode = new AnimationBlendNode(blendTree, ["moveSpeed"], BlendMethods.Simple1D, [0], 1);
        blendTree.rootNode.addChild(notAimingNode);

        // moveSpeed == 0
        const idleNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [0], 1, getAnimationByName(animations, "Female.Idle"));
        notAimingNode.addChild(idleNode);

        // moveSpeed == 0.5
        const walkNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [0.5], 0, getAnimationByName(animations, "Female.Walk"));
        notAimingNode.addChild(walkNode);

        // moveSpeed == 1
        const jogNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [1], 0, getAnimationByName(animations, "Female.Jog"));
        notAimingNode.addChild(jogNode);

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

        const maskRootName = "spine.001";
        const upperBodyRootJoint = actor.getChildByName(maskRootName, true);
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
        aimBlendTree.rootNode = new AnimationBlendNode(aimBlendTree, ["aimUpDown"], BlendMethods.Simple1D, undefined, 1);

        // aimUpDown == -1
        const aimDownNode = new AnimationBlendNode(aimBlendTree, undefined, BlendMethods.Direct, [-1], 0, getAnimationByName(animations, "Female.Aim.Down"));
        aimBlendTree.rootNode.addChild(aimDownNode);

        // aimUpDown == 0
        const aimStraightNode = new AnimationBlendNode(aimBlendTree, undefined, BlendMethods.Direct, [0], 1, getAnimationByName(animations, "Female.Aim.Middle"));
        aimBlendTree.rootNode.addChild(aimStraightNode);

        // aimUpDown == 1
        const aimUpNode = new AnimationBlendNode(aimBlendTree, undefined, BlendMethods.Direct, [1], 0, getAnimationByName(animations, "Female.Aim.Down"));
        aimBlendTree.rootNode.addChild(aimUpNode);

        // shoot state (blend tree)
        const shootBlendTree = new ActionStateBlendTree("upperShootTree", upperBodyLayer.stateMachine);
        upperBodyLayer.stateMachine.addState(shootBlendTree);

        // fix me: model animations not done
        // root node
        //      | -shoot down
        //      | -shoot straight
        //      | -shoot up

        shootBlendTree.rootNode = new AnimationBlendNode(shootBlendTree, ["aimUpDown"], BlendMethods.Simple1D, undefined, 1);

        // aimUpDown == -1
        const shootDownNode = new AnimationBlendNode(shootBlendTree, undefined, BlendMethods.Direct, [-1], 0,
            getAnimationByName(animations, "Female.Shoot.Down"));
        shootBlendTree.rootNode.addChild(shootDownNode);

        // aimUpDown == 0
        const shootStraitNode = new AnimationBlendNode(shootBlendTree, undefined, BlendMethods.Direct, [0], 1,
            getAnimationByName(animations, "Female.Shoot.Middle"));
        shootBlendTree.rootNode.addChild(shootStraitNode);

        // aimUpDown == 1
        const shootUpNode = new AnimationBlendNode(shootBlendTree, undefined, BlendMethods.Direct, [1], 0,
            getAnimationByName(animations, "Female.Shoot.Down"));
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
    }
}

function addJointHierarchyToLayerMask(rootJoint: Object3D, mask: AnimationMask) {
    mask.joints.push(rootJoint);
    for (const child of rootJoint.children) {
        addJointHierarchyToLayerMask(child, mask);
    }
}

function getAnimationByName(animations: AnimationAction[], animName: string) {
    const anim = animations.find((anim) => { anim.name === animName; });
    if (anim === undefined) {
        throw new Error("Animation not found: " + animName);
    }
    return anim;
}

function createScene(physicsWorld: PhysicsWorld, widgetPhysicsMtl: CANNON.Material, scene: Scene, addPlane: (name: string, width: number, height: number, position: vec3, rotation: quat, wallColor: vec4, metallic: number, roughness: number, scene: Scene, world: PhysicsWorld, physicsMtl: CANNON.Material, textureUrl?: string | undefined) => void, groundPhysicsMtl: CANNON.Material) {
    {
        const boxMesh = new Mesh();
        boxMesh.name = "box01";
        boxMesh.geometry = new BoxGeometry(0.25, 0.25, 0.25);
        boxMesh.castShadow = true;
        boxMesh.isStatic = false;
        boxMesh.autoUpdateTransform = true;
        boxMesh.translation.setComponents(0, 1, 0);
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
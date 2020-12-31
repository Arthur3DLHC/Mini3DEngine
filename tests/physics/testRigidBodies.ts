import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock, SphereGeometry, CylinderGeometry, PlaneGeometry, PointLight, SpotLight, DirectionalLight, DirectionalLightShadow, EnvironmentProbe, SRTTransform, LoadingManager, TextureLoader, Texture, Texture2D, TextureCube, ImageLoader, SamplerState, EnvironmentProbeType, PhysicsWorld, RigidBody } from "../../src/mini3DEngine.js";
import vec3 from "../../lib/tsm/vec3.js";
import { AutoRotateBehavior } from "../common/behaviors/autoRotateBehavior.js";
import vec4 from "../../lib/tsm/vec4.js";
import { LookatBehavior } from "../common/behaviors/lookatBehavior.js";
import { FirstPersonViewBehavior } from "../common/behaviors/firstPersonViewBehavior.js";
import mat4 from "../../lib/tsm/mat4.js";
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

    const renderer = new ClusteredForwardRenderer();
    const scene = new Scene();
    const camera = new PerspectiveCamera();
    camera.aspect = canvas.width / canvas.height;
    camera.far = 20;
    // camera.localTransform.fromTranslation(new vec3([0, 0, 2]));
    camera.autoUpdateTransform = true;

    scene.attachChild(camera);

    // add a box mesh to present the player character?
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

    // and add rigid body for player character
    // use a compound shape from two spheres
    // fixed rotation
    const playerBody = new RigidBody(playerMesh, physicsWorld, {mass: 5, material: playerPhysicsMtl});
    physicsWorld.world.addBody(playerBody.body);
    
    // add rigid body last? after third person control
    playerMesh.behaviors.push(playerBody);

    playerBody.body.fixedRotation = true;
    playerBody.affectRotation = false;

    playerBody.setPosition(playerMesh.translation);
    playerBody.setRotation(playerMesh.rotation);

    // cannon does not have capsule shape, so use some spheres...
    const playerShapeLow = new CANNON.Sphere(0.3);
    const playerShapeMedium = new CANNON.Sphere(0.3);
    const playerShapeHigh = new CANNON.Sphere(0.3);

    playerBody.body.addShape(playerShapeLow, new CANNON.Vec3(0, -0.55, 0));
    playerBody.body.addShape(playerShapeMedium, new CANNON.Vec3(0, 0, 0));
    playerBody.body.addShape(playerShapeHigh, new CANNON.Vec3(0, 0.55, 0));

    // NOTE: if use a animated character model load from gltf, the offsets should be:

    // playerBody.body.addShape(playerShapeLow, new CANNON.Vec3(0, 0.3, 0));
    // playerBody.body.addShape(playerShapeMedium, new CANNON.Vec3(0, 0.85, 0));
    // playerBody.body.addShape(playerShapeHigh, new CANNON.Vec3(0, 1.4, 0));

    // first person view controller
    // todo: use third person controller
    const tpsBehavior = new ThirdPersonCtrlBehavior(playerMesh, playerBody, camera);
    playerMesh.behaviors.push(tpsBehavior);
    tpsBehavior.cameraVerticalOffset = 0.8;
    tpsBehavior.cameraHorizontalOffset = new vec3([0.5, 0, 1.5]);
    tpsBehavior.moveSpeed = 2;

    // const fpsBehavior = new FirstPersonViewBehavior(camera);
    // camera.behaviors.push(fpsBehavior);
    // fpsBehavior.position = new vec3([0, 2, 2]);

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


    // todo: add multiple objects with physics shapes to scene
    // both dynamics and statics

    // test box geometry
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
        const sphereBody = new RigidBody(sphereMesh, physicsWorld, {mass:0.4, material: widgetPhysicsMtl});
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

    /*
    const sphereAutoRot = new AutoRotateBehavior(sphereMesh);
    sphereMesh.behaviors.push(sphereAutoRot);

    scene.attachChild(sphereMesh);
    */

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
    // const matPlaneRot = new mat4();
    // const matPlaneTran = new mat4();

    // matPlaneRot.setIdentity();
    // matPlaneTran.fromTranslation(new vec3([0, -2, 0]));

    const planePosition = new vec3([0, 0, 0]);
    const planeRotation = quat.fromEuler(0, 0, 0, "ZXY");
    
    addPlane("floor", 40, 40, planePosition, planeRotation, new vec4([1.0, 1.0, 1.0, 1.0]), 0.5, 0.5, scene, physicsWorld, groundPhysicsMtl);

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
    SceneHelper.addEnvProbe("envProbe01", 20, new vec3([ 0, 1, 0]), scene, EnvironmentProbeType.Reflection);
    SceneHelper.addEnvProbe("irrProbe01", 20, new vec3([ 0, 1, 0]), scene, EnvironmentProbeType.Irradiance);

    const infoPanel: HTMLDivElement = document.getElementById("infoPanel") as HTMLDivElement;

    let lastUpdateFPSTime = 0;
    let curFPS = 0;


    function gameLoop(now: number) {
        Clock.instance.update(now);
        physicsWorld.step();
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
}



import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock, SphereGeometry, CylinderGeometry, PlaneGeometry, PointLight, SpotLight, DirectionalLight, DirectionalLightShadow, EnvironmentProbe, SRTTransform, LoadingManager, TextureLoader, Texture, Texture2D, TextureCube, ImageLoader, SamplerState, GLTFLoader, GLTFSceneBuilder, GltfAsset, Object3D, BoundingRenderModes, ActionSelector, SkinMesh, ActionStateMachine, ActionState, AnimationAction, ActionTransition, TimeUpCondition, ActionCondition } from "../../src/mini3DEngine.js";
import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";
import { LookatBehavior } from "../common/behaviors/lookatBehavior.js";
import { FirstPersonViewBehavior } from "../common/behaviors/firstPersonViewBehavior.js";
import { MakePoseBehavior, MakePoses } from "./behaviors/makePoseBehavior.js";
import { ActionControlBehavior } from "../common/behaviors/actionControlBehavior.js";
import { MakePoseCondition } from "./actionStates/makePoseCondition.js";
import { MakePoseState } from "./actionStates/makePoseState.js";

/**
 * Load gltf files using promise
 */

window.onload = () => {
    const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
    if (!canvas) {
        console.error("Canvas not found");
        return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    GLDevice.initialize(canvas);

    const loadingManager = new LoadingManager();
    const imageLoader = new ImageLoader(loadingManager);
    // const textureLoader = new TextureLoader(loadingManager);
    const gltfLoader = new GLTFLoader(loadingManager);

    const renderer = new ClusteredForwardRenderer();
    renderer.postprocessor.bloom.threshold = 5;
    renderer.postprocessor.bloom.intensity = 0.5;
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
    /*
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
    */
   
    // test environment probes
    // addEnvProbe("envProbe01", 6, new vec3([ 0, 0, 0]), scene);

    const infoPanel: HTMLDivElement = document.getElementById("infoPanel") as HTMLDivElement;

    let lastUpdateFPSTime = 0;
    let curFPS = 0;

    const actionSelectorFemale: ActionSelector = new ActionSelector();
    const actionSelectorMale: ActionSelector = new ActionSelector();

    const maleActionPoses: Map<string, Object3D> = new Map<string, Object3D>();
    const femaleActionPoses: Map<string, Object3D> = new Map<string, Object3D>();

    console.log("loading gltf model...");

    const gltfPromiseFemale: Promise<GltfAsset> = gltfLoader.load("./models/std_female/std_female_animation.gltf");
    const gltfPromiseMale: Promise<GltfAsset> = gltfLoader.load("./models/std_male/std_male_animation.gltf");

    // todo: load room scene
    const gltfPromiseRoom: Promise<GltfAsset> = gltfLoader.load("./models/InnRoom/InnRoom.gltf");

    console.log("loading skybox...");

    // todo: use outdoor sky box
    const imagePromises: (Promise<HTMLImageElement|ImageData>)[] = [];
    const isHDR = true;
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
            "./textures/skyboxes/rooitou_park_2k/px.png",
            "./textures/skyboxes/rooitou_park_2k/nx.png",
            "./textures/skyboxes/rooitou_park_2k/py.png",
            "./textures/skyboxes/rooitou_park_2k/ny.png",
            "./textures/skyboxes/rooitou_park_2k/pz.png",
            "./textures/skyboxes/rooitou_park_2k/nz.png",
        ];
    }

    for (let i = 0; i < 6; i++) {
        const imgPromise: Promise<HTMLImageElement|ImageData> = imageLoader.loadPromise(envmapUrls[i]);
        imagePromises.push(imgPromise);
    }

    const imagesPromise = Promise.all(imagePromises);

    Promise.all([gltfPromiseFemale, gltfPromiseMale, gltfPromiseRoom, imagesPromise]).then((loaded) => {
        const skyboxTexture: TextureCube = new TextureCube();

        for(let i = 0; i < 6; i++) {
            skyboxTexture.images[i] = loaded[3][i];
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
        scene.irradianceIntensity = 30;
        
        // gltf asset should has been already loaded?
        console.log("building gltf scene...");

        const builderFemale = new GLTFSceneBuilder();
        
        const gltfSceneFemale = builderFemale.build(loaded[0], 0, actionSelectorFemale.actions);
        // gltfSceneFemale.rotation = quat.fromAxisAngle(new vec3([0, 1, 0]), Math.PI);
        gltfSceneFemale.name = "Female";
        gltfSceneFemale.autoUpdateTransform = true;
        scene.attachChild(gltfSceneFemale);

        prepareGLTFCharacter(gltfSceneFemale);
        const femaleBehavior = buildFemaleBehavior(gltfSceneFemale, actionSelectorFemale.actions, femaleActionPoses);

        const builderMale = new GLTFSceneBuilder();

        const gltfSceneMale = builderMale.build(loaded[1], 0, actionSelectorMale.actions);
        // gltfSceneMale.rotation = quat.fromAxisAngle(new vec3([0, 1, 0]), Math.PI);
        gltfSceneMale.name = "Male";
        gltfSceneMale.autoUpdateTransform = true;
        scene.attachChild(gltfSceneMale);

        prepareGLTFCharacter(gltfSceneMale);
        const maleBehavior = buildMaleBehavior(gltfSceneMale, actionSelectorMale.actions, maleActionPoses);

        const actionNames = [
            "Idle",
            "Dancing",
            "Masturbating",
            "Breast",
            "Oral",
            "CowGirl",
            "CowGirl Fast",
            "CowGirl Cum",
            "CowGirl Rest"
        ];

        const femaleActionNames = [
            "Female.Idle",
            "Female.Dance001",
            "Female.Masturbating",
            "Female.Breast",
            "Female.Oral",
            "Female.CowGirl",
            "Female.CowGirl.Fast",
            "Female.CowGirl.Cum",
            "Female.CowGirl.Rest",
        ];

        const maleActionNames = [
            "Male.Idle",
            "Male.Idle",
            "Male.Idle",
            "Male.Breast",
            "Male.Oral",
            "Male.CowGirl",
            "Male.CowGirl.Fast",
            "Male.CowGirl.Cum",
            "Male.CowGirl.Rest",
        ];

        const builderRoom = new GLTFSceneBuilder()
        const gltfSceneRoom = builderRoom.build(loaded[2], 0);
        gltfSceneRoom.name = "Room";
        // gltfSceneRoom.autoUpdateTransform = true;
        scene.attachChild(gltfSceneRoom);

        prepareGLTFScene(gltfSceneRoom, maleActionPoses, femaleActionPoses);

        // todo: add all action names to action list UI
        const actionList: HTMLDivElement = document.getElementById("actionList") as HTMLDivElement;
        actionList.innerHTML = "";

        for (let actidx = 0; actidx < actionNames.length; actidx++) {
            const actionItem: HTMLDivElement = document.createElement("div");
                actionItem.id = "action_" + actidx;
                actionItem.innerHTML = actionNames[actidx];
                actionItem.className = "actionItem";
                actionItem.onclick = (ev: MouseEvent) => {
                    actionSelectorMale.playAction(maleActionNames[actidx]);
                    actionSelectorFemale.playAction(femaleActionNames[actidx]);

                    // todo: put characters on love pose location
                    const lovePoseFemale = femaleActionPoses.get(femaleActionNames[actidx]);
                    if (lovePoseFemale !== undefined) {
                        lovePoseFemale.translation.copy(gltfSceneFemale.translation);
                        lovePoseFemale.rotation.copy(gltfSceneFemale.rotation);
                        gltfSceneFemale.updateLocalTransform();
                    }

                    const lovePoseMale = maleActionPoses.get(maleActionNames[actidx]);
                    if (lovePoseMale !== undefined) {
                        // the rotation and translation should be relative to the room scene root node
                        lovePoseMale.translation.copy(gltfSceneMale.translation);
                        lovePoseMale.rotation.copy(gltfSceneMale.rotation);
                        gltfSceneMale.updateLocalTransform();
                    }

                }
                actionList.appendChild(actionItem);
        }

        console.log("start game loop...");

        Clock.instance.start();
        requestAnimationFrame(gameLoop);

    });
    
    function gameLoop(now: number) {
        Clock.instance.update(now);
        scene.updateBehavior();

        actionSelectorFemale.update(Clock.instance.curTime, Clock.instance.elapsedTime);
        actionSelectorMale.update(Clock.instance.curTime, Clock.instance.elapsedTime);

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

    function prepareGLTFScene(gltfNode: Object3D, maleActionPoses: Map<string, Object3D>, femaleActionPoses: Map<string, Object3D>) {
        gltfNode.isStatic = true;
        gltfNode.autoUpdateTransform = false;
        gltfNode.updateLocalTransform();
        
        if (gltfNode instanceof Mesh) {
            gltfNode.castShadow = true;
            gltfNode.receiveShadow = true;
            gltfNode.boundingSphereRenderMode = BoundingRenderModes.none;
        }
        else if (gltfNode instanceof EnvironmentProbe) {
            const envProbe = gltfNode as EnvironmentProbe;
            // envProbe.debugDraw = true;
        }

        // todo: name prefix? if love position, put the translation and position to action position list
        if (gltfNode.name.startsWith("LovePose.Male.")) {
            const malePoseName = gltfNode.name.substr(9);
            maleActionPoses.set(malePoseName, gltfNode);
        } else if(gltfNode.name.startsWith("LovePose.Female.")) {
            const femalePoseName = gltfNode.name.substr(9);
            femaleActionPoses.set(femalePoseName, gltfNode);
        }

        for (const child of gltfNode.children) {
            prepareGLTFScene(child, maleActionPoses, femaleActionPoses);
        }
    }

    function setAnimationFor(state: ActionState, animName: string, animations: AnimationAction[]) {
        const anim = animations.find((action: AnimationAction) => {return action.name === animName});
        if (anim !== undefined) {
            state.animation = anim;
        }
    }

    function addNewState(character: Object3D, stateMachine: ActionStateMachine, stateName: string, animName: string, animations: AnimationAction[], locations: Map<string, Object3D>): ActionState {
        const location = locations.get(animName);
        if (location === undefined) {
            throw new Error("Make location not found:" + animName);
        }
        const state = new MakePoseState(stateName, location, character);
        setAnimationFor(state, animName, animations);
        stateMachine.addState(state);
        return state;
    }

    function addStateTransition(from: ActionState, to: ActionState, conditions: ActionCondition[]): ActionTransition {
        const transition = new ActionTransition(from);
        transition.targetState = to;
        for (const condition of conditions) {
            transition.conditions.push(condition);
        }
        from.transitions.push(transition);
        return transition;
    }

    function buildFemaleBehavior(female: Object3D, animations: AnimationAction[], locations: Map<string, Object3D>): MakePoseBehavior {
        // add behavior
        const makePose = new MakePoseBehavior(female);
        female.behaviors.push(makePose);

        const actionCtrl = new ActionControlBehavior(female);
        female.behaviors.push(actionCtrl);

        // fix me: how to change the action menu on UI when enter states?

        // build action state machine
        // states
        const idle = addNewState(female, actionCtrl.stateMachine, "idle", "Female.Idle", animations, locations);
        const dance = addNewState(female, actionCtrl.stateMachine, "dance", "Female.Dance001", animations, locations);
        const masturbating = addNewState(female, actionCtrl.stateMachine, "masturbating", "Female.Masturbating", animations, locations);
        const breast = addNewState(female, actionCtrl.stateMachine, "breast", "Female.Breast", animations, locations);
        const oral = addNewState(female, actionCtrl.stateMachine, "oral", "Female.Oral", animations, locations);
        const cowGirl = addNewState(female, actionCtrl.stateMachine, "cowGril", "Female.CowGirl", animations, locations);
        const cowGirlFast = addNewState(female, actionCtrl.stateMachine, "cowGrilFast", "Female.CowGirl.Fast", animations, locations);
        const cowGirlCum = addNewState(female, actionCtrl.stateMachine, "cowGrilCum", "Female.CowGirl.Cum", animations, locations);
        const cowGirlRest = addNewState(female, actionCtrl.stateMachine, "cowGrilRest", "Female.CowGirl.Rest", animations, locations);

        // transitions and their conditions
        addStateTransition(idle, dance, [new MakePoseCondition(MakePoses.DANCE, makePose)]);
        addStateTransition(dance, masturbating, [new MakePoseCondition(MakePoses.MASTURBATE, makePose)]);
        addStateTransition(masturbating, breast, [new MakePoseCondition(MakePoses.BREAST, makePose)]);
        addStateTransition(masturbating, oral, [new MakePoseCondition(MakePoses.ORAL, makePose)]);
        addStateTransition(breast, oral, [new MakePoseCondition(MakePoses.ORAL, makePose)]);
        addStateTransition(oral, cowGirl, [new MakePoseCondition(MakePoses.COWGIRL, makePose)]);
        addStateTransition(cowGirl, cowGirlFast, [new MakePoseCondition(MakePoses.COWGIRL_FAST, makePose)]);
        addStateTransition(cowGirlFast, cowGirl, [new MakePoseCondition(MakePoses.COWGIRL, makePose)]);
        addStateTransition(cowGirlFast, cowGirlCum, [new MakePoseCondition(MakePoses.COWGIRL_CUM, makePose)]);
        addStateTransition(cowGirlCum, cowGirlRest, [new TimeUpCondition(cowGirlCum.animation? cowGirlCum.animation.duration : 5)]);
        // rest to masturbating again?
        addStateTransition(cowGirlRest, masturbating, [new MakePoseCondition(MakePoses.MASTURBATE, makePose)]);
    
        // enter
        actionCtrl.stateMachine.curState = idle;

        return makePose;
    }

    function buildMaleBehavior(male: Object3D, animations: AnimationAction[], locations: Map<string, Object3D>): MakePoseBehavior {
        // add behavior
        const makePose = new MakePoseBehavior(male);
        male.behaviors.push(makePose);

        const actionCtrl = new ActionControlBehavior(male);
        male.behaviors.push(actionCtrl);

        // build action state machine
        // states
        const idle = addNewState(male, actionCtrl.stateMachine, "idle", "Male.Idle", animations, locations);
        const dance = addNewState(male, actionCtrl.stateMachine, "dance", "Male.Idle", animations, locations);
        const masturbating = addNewState(male, actionCtrl.stateMachine, "masturbating", "Male.Idle", animations, locations);
        const breast = addNewState(male, actionCtrl.stateMachine, "breast", "Male.Breast", animations, locations);
        const oral = addNewState(male, actionCtrl.stateMachine, "oral", "Male.Oral", animations, locations);
        const cowGirl = addNewState(male, actionCtrl.stateMachine, "cowGril", "Male.CowGirl", animations, locations);
        const cowGirlFast = addNewState(male, actionCtrl.stateMachine, "cowGrilFast", "Male.CowGirl.Fast", animations, locations);
        const cowGirlCum = addNewState(male, actionCtrl.stateMachine, "cowGrilCum", "Male.CowGirl.Cum", animations, locations);
        const cowGirlRest = addNewState(male, actionCtrl.stateMachine, "cowGrilRest", "Male.CowGirl.Rest", animations, locations);

        // transitions and their conditions
        addStateTransition(idle, dance, [new MakePoseCondition(MakePoses.DANCE, makePose)]);
        addStateTransition(dance, masturbating, [new MakePoseCondition(MakePoses.MASTURBATE, makePose)]);
        addStateTransition(masturbating, breast, [new MakePoseCondition(MakePoses.BREAST, makePose)]);
        addStateTransition(masturbating, oral, [new MakePoseCondition(MakePoses.ORAL, makePose)]);
        addStateTransition(breast, oral, [new MakePoseCondition(MakePoses.ORAL, makePose)]);
        addStateTransition(oral, cowGirl, [new MakePoseCondition(MakePoses.COWGIRL, makePose)]);
        addStateTransition(cowGirl, cowGirlFast, [new MakePoseCondition(MakePoses.COWGIRL_FAST, makePose)]);
        addStateTransition(cowGirlFast, cowGirl, [new MakePoseCondition(MakePoses.COWGIRL, makePose)]);
        addStateTransition(cowGirlFast, cowGirlCum, [new MakePoseCondition(MakePoses.COWGIRL_CUM, makePose)]);
        addStateTransition(cowGirlCum, cowGirlRest, [new TimeUpCondition(cowGirlCum.animation? cowGirlCum.animation.duration : 5)]);
        // rest to masturbating again?
        addStateTransition(cowGirlRest, masturbating, [new MakePoseCondition(MakePoses.MASTURBATE, makePose)]);

        // enter
        actionCtrl.stateMachine.curState = idle;

        return makePose;
    }
}



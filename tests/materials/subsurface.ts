    let lastUpdateFPSTime = 0;
    import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock, SphereGeometry, CylinderGeometry, PlaneGeometry, PointLight, SpotLight, DirectionalLight, DirectionalLightShadow, EnvironmentProbe, SRTTransform, LoadingManager, TextureLoader, Texture, Texture2D, TextureCube, ImageLoader, SamplerState, EnvironmentProbeType } from "../../src/mini3DEngine.js";
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
    
        // add a static sphere with subsurface material
        // use control pannel to control the subsurface parameters
        {
            const sphereMesh = new Mesh();
            sphereMesh.name = "sphere.Static";
            sphereMesh.localTransform.fromTranslation(new vec3([-0.75, 0, 0]));
            sphereMesh.geometry = new SphereGeometry(0.5, 16, 8);
            sphereMesh.castShadow = true;
            sphereMesh.isStatic = true;
            sphereMesh.autoUpdateTransform = false;
            const sphereMtl = new StandardPBRMaterial();
            sphereMtl.color = new vec4([1.0, 1.0, 1.0, 1.0]);
            sphereMtl.metallic = 0.0;
            sphereMtl.roughness = 0.75;
            sphereMtl.specular = 0.25;
            sphereMtl.subsurface = 1;
            sphereMtl.subsurfaceColor = new vec3([1.0, 0.2, 0.0]);
            sphereMtl.subsurfaceRadius = 0.2;
            sphereMtl.subsurfaceThickness = 0.5;
            sphereMtl.subsurfacePower = 12;
            sphereMesh.materials.push(sphereMtl);
        
            scene.attachChild(sphereMesh);
        }

        // add a static cylinder sphere with subsurface material
        const cylinderMesh = new Mesh();
        cylinderMesh.name = "cylinder01";
        cylinderMesh.localTransform.fromTranslation(new vec3([0.75, 0, 0]));
        cylinderMesh.geometry = new CylinderGeometry(0.25, 0.5, 24);
        cylinderMesh.castShadow = true;
        cylinderMesh.isStatic = true;
        cylinderMesh.autoUpdateTransform = false;
        const cylinderMtl = new StandardPBRMaterial();
        cylinderMtl.color = new vec4([0.0, 1.0, 0.0, 1.0]);
        cylinderMtl.emissive = new vec4([0.0, 0.0, 0.0, 1]);
        cylinderMtl.metallic = 0.01;
        cylinderMtl.roughness = 0.6;
        cylinderMtl.subsurface = 0.1;
        cylinderMtl.subsurfaceColor = new vec3([0.0, 1.0, 0.0]);
        cylinderMtl.subsurfaceRadius = 1;
        cylinderMtl.subsurfaceThickness = 0.5;
        cylinderMtl.subsurfacePower = 1;
        cylinderMesh.materials.push(cylinderMtl);
    
        /*
        const cylinderAutoRot = new AutoRotateBehavior(cylinderMesh);
        cylinderMesh.behaviors.push(cylinderAutoRot);
        */
    
        scene.attachChild(cylinderMesh);
    
        const matPlaneRot = new mat4();
        const matPlaneTran = new mat4();
    
        matPlaneRot.setIdentity();
        matPlaneTran.fromTranslation(new vec3([0, -0.5, 0]));
        
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
            scene.backgroundIntensity = 0.1;
    
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
        }
    }
    
    
    
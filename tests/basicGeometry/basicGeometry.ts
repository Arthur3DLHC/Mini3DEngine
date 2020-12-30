import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock, SphereGeometry, CylinderGeometry, PlaneGeometry, PointLight, SpotLight, DirectionalLight } from "../../src/mini3DEngine.js";
import vec3 from "../../lib/tsm/vec3.js";
import { AutoRotateBehavior } from "../common/behaviors/autoRotateBehavior.js";
import vec4 from "../../lib/tsm/vec4.js";

window.onload = () => {
    const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
    if (!canvas) {
        console.error("Canvas not found");
        return;
    }

    GLDevice.initialize(canvas);

    const renderer = new ClusteredForwardRenderer();
    const scene = new Scene();
    const camera = new PerspectiveCamera();
    camera.aspect = canvas.width / canvas.height;
    camera.localTransform.fromTranslation(new vec3([0, 0, 5]));
    camera.autoUpdateTransform = false;
    scene.attachChild(camera);

    // todo: test multiple objects in scene at same time

    // test box geometry
    const boxMesh = new Mesh();
    boxMesh.name = "box01";
    boxMesh.geometry = new BoxGeometry(1, 1, 1);
    // boxMesh.localTransform.fromTranslation(new vec3([0, 0, -5]));
    const boxMtl = new StandardPBRMaterial();
    boxMtl.color = new vec4([1.0, 1.0, 0.0, 1.0]);
    boxMtl.metallic = 0.8;
    boxMtl.roughness = 0.4;
    boxMesh.materials.push(boxMtl);

    // auto rotate
    const boxAutoRot = new AutoRotateBehavior(boxMesh);
    boxMesh.behaviors.push(boxAutoRot);

    scene.attachChild(boxMesh);

    const sphereMesh = new Mesh();
    sphereMesh.name = "sphere01";
    sphereMesh.localTransform.fromTranslation(new vec3([0, 0, 3]));
    sphereMesh.geometry = new SphereGeometry(1, 16, 8);
    const sphereMtl = new StandardPBRMaterial();
    sphereMtl.color = new vec4([1.0, 0.0, 0.0, 1.0]);
    sphereMtl.metallic = 0.8;
    sphereMtl.roughness = 0.6;
    sphereMesh.materials.push(sphereMtl);

    boxMesh.attachChild(sphereMesh);

    /*
    const sphereAutoRot = new AutoRotateBehavior(sphereMesh);
    sphereMesh.behaviors.push(sphereAutoRot);

    scene.attachChild(sphereMesh);
    */

    const cylinderMesh = new Mesh();
    cylinderMesh.name = "cylinder01";
    cylinderMesh.localTransform.fromTranslation(new vec3([3, 0, 0]));
    cylinderMesh.geometry = new CylinderGeometry(1, 2, 24);
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

    // plane
    const planeMesh = new Mesh();
    planeMesh.name = "plane01";
    planeMesh.localTransform.fromTranslation(new vec3([0, -0.5, 0]));
    planeMesh.geometry = new PlaneGeometry(20, 20, 1, 1);
    const planeMtl = new StandardPBRMaterial();
    planeMtl.color = new vec4([0.0, 0.0, 1.0, 1.0]);
    planeMtl.metallic = 0.0;
    planeMesh.materials.push(planeMtl);

    scene.attachChild(planeMesh);

    // add some lights
    // test static lights first
    // const pointLight01 = new PointLight();
    // pointLight01.isStatic = true;
    // pointLight01.on = true;
    // pointLight01.color = new vec4([5, 5, 5, 1]);
    // pointLight01.distance = 10;
    // pointLight01.localTransform.fromTranslation(new vec3([1, 3, 1]));

    // scene.attachChild(pointLight01);
    
    // const pointLight02 = new PointLight();
    // pointLight02.isStatic = true;
    // pointLight02.on = true;
    // pointLight02.color = new vec4([10, 10, 10, 1]);
    // pointLight02.distance = 10;
    // pointLight02.localTransform.fromTranslation(new vec3([3, 3, 3]));

    // scene.attachChild(pointLight02);

    // const spotLight01 = new SpotLight();
    // spotLight01.isStatic = true;
    // spotLight01.on = true;
    // spotLight01.color = new vec4([5, 5, 5, 1]);
    // spotLight01.distance = 0;
    // spotLight01.localTransform.fromTranslation(new vec3([0, 0, 3]));

    // scene.attachChild(spotLight01);

    const dirLight01 = new DirectionalLight();
    dirLight01.isStatic = true;
    dirLight01.on = true;
    dirLight01.color = new vec4([3,3,3,1]);
    dirLight01.localTransform.fromRotation(-Math.PI / 4, new vec3([1,1,1]));
    scene.attachChild(dirLight01);

    Clock.instance.start();

    function gameLoop(now: number) {
        Clock.instance.update(now);

        scene.update();

        renderer.render(scene);

        // test drawing a screen space rectangle
        // renderer.renderScreenRect(0.2, 0.2, 0.4, 0.2, new vec4([1,1,1,1]));

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
}
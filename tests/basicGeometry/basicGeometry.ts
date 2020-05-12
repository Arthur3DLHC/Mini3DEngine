import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock, SphereGeometry, CylinderGeometry, PlaneGeometry, PointLight } from "../../src/miniEngine.js";
import vec3 from "../../lib/tsm/vec3.js";
import { AutoRotateBehavior } from "./autoRotateBehavior.js";
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
    scene.attachChild(camera);

    // todo: test multiple objects in scene at same time

    // test box geometry
    const boxMesh = new Mesh();
    boxMesh.name = "box01";
    boxMesh.geometry = new BoxGeometry(1, 1, 1);
    // boxMesh.localTransform.fromTranslation(new vec3([0, 0, -5]));
    const material = new StandardPBRMaterial();
    boxMesh.materials.push(material);

    // auto rotate
    const boxAutoRot = new AutoRotateBehavior(boxMesh);
    boxMesh.behaviors.push(boxAutoRot);

    scene.attachChild(boxMesh);

    const sphereMesh = new Mesh();
    sphereMesh.name = "sphere01";
    sphereMesh.localTransform.fromTranslation(new vec3([0, 0, 3]));
    sphereMesh.geometry = new SphereGeometry(1, 8, 4);
    const sphereMtl = new StandardPBRMaterial();
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
    cylinderMesh.geometry = new CylinderGeometry(1, 2, 8);
    const cylinderMtl = new StandardPBRMaterial();
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
    planeMesh.geometry = new PlaneGeometry(2, 2, 1, 1);
    const planeMtl = new StandardPBRMaterial();
    planeMesh.materials.push(planeMtl);

    scene.attachChild(planeMesh);

    // add some lights
    // test static lights first
    const pointLight = new PointLight();
    pointLight.isStatic = true;
    pointLight.on = true;
    pointLight.color = new vec4([1, 0, 0, 1]);
    pointLight.distance = 50;
    pointLight.localTransform.fromTranslation(new vec3([0, 3, 0]));

    scene.attachChild(pointLight);

    Clock.instance.start();

    function gameLoop(now: number) {
        Clock.instance.update(now);
        scene.updateBehavior();
        scene.updateWorldTransform(false, true);
        renderer.render(scene);
        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
}
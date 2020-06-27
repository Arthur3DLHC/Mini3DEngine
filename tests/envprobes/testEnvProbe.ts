import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock, SphereGeometry, CylinderGeometry, PlaneGeometry, PointLight, SpotLight, DirectionalLight, DirectionalLightShadow, EnvironmentProbe, SRTTransform } from "../../src/mini3DEngine.js";
import vec3 from "../../lib/tsm/vec3.js";
import { AutoRotateBehavior } from "../common/behaviors/autoRotateBehavior.js";
import vec4 from "../../lib/tsm/vec4.js";
import { LookatBehavior } from "../common/behaviors/lookatBehavior.js";
import { FirstPersonViewBehavior } from "../common/behaviors/firstPersonViewBehavior.js";
import mat4 from "../../lib/tsm/mat4.js";

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
    camera.far = 20;
    camera.localTransform.fromTranslation(new vec3([0, 0, 2]));

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

    // todo: test multiple objects in scene at same time

    // test box geometry
    const boxMesh = new Mesh();
    boxMesh.name = "box01";
    boxMesh.geometry = new BoxGeometry(0.25, 0.25, 0.25);
    boxMesh.castShadow = true;
    boxMesh.isStatic = false;
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
    sphereMesh.localTransform.fromTranslation(new vec3([0, 0, 0.75]));
    sphereMesh.geometry = new SphereGeometry(0.2, 16, 8);
    sphereMesh.castShadow = true;
    sphereMesh.isStatic = false;
    const sphereMtl = new StandardPBRMaterial();
    sphereMtl.color = new vec4([1.0, 1.0, 1.0, 1.0]);
    sphereMtl.metallic = 0.2;
    sphereMtl.roughness = 0.1;
    sphereMesh.materials.push(sphereMtl);

    boxMesh.attachChild(sphereMesh);

    /*
    const sphereAutoRot = new AutoRotateBehavior(sphereMesh);
    sphereMesh.behaviors.push(sphereAutoRot);

    scene.attachChild(sphereMesh);
    */

    const cylinderMesh = new Mesh();
    cylinderMesh.name = "cylinder01";
    cylinderMesh.localTransform.fromTranslation(new vec3([0.75, 0, 0]));
    cylinderMesh.geometry = new CylinderGeometry(0.25, 0.5, 24);
    cylinderMesh.castShadow = true;
    cylinderMesh.isStatic = true;
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

    const matPlaneRot = new mat4();
    const matPlaneTran = new mat4();

    matPlaneRot.setIdentity();
    matPlaneTran.fromTranslation(new vec3([0, -2, 0]));
    
    addPlane("floor", matPlaneTran, matPlaneRot, new vec4([1.0, 1.0, 1.0, 1.0]), 0.5, 0.5, scene);

    // ceiling
    matPlaneRot.fromZRotation(Math.PI);
    matPlaneTran.fromTranslation(new vec3([0, 2, 0]));

    addPlane("ceiling", matPlaneTran, matPlaneRot, new vec4([1.0, 1.0, 1.0, 1.0]), 0.05, 0.8, scene);

    // back wall
    matPlaneRot.fromXRotation(Math.PI * 0.5);
    matPlaneTran.fromTranslation(new vec3([0, 0, -2]));

    addPlane("backWall", matPlaneTran, matPlaneRot, new vec4([1.0, 1.0, 1.0, 1.0]), 0.05, 0.8, scene);

    // left wall
    matPlaneRot.fromZRotation(-Math.PI * 0.5);
    matPlaneTran.fromTranslation(new vec3([-2, 0, 0]));

    addPlane("leftWall", matPlaneTran, matPlaneRot, new vec4([1.0, 0.0, 0.0, 1.0]), 0.05, 0.8, scene);

    // right wall
    matPlaneRot.fromZRotation(Math.PI * 0.5);
    matPlaneTran.fromTranslation(new vec3([2, 0, 0]));
    
    addPlane("rightWall", matPlaneTran, matPlaneRot, new vec4([0.0, 1.0, 0.0, 1.0]), 0.05, 0.8, scene);

    // add some lights
    // todo: test point light shadow

    const pointLight01 = new PointLight();
    pointLight01.isStatic = true;
    pointLight01.on = true;
    pointLight01.castShadow = true;
    // if (pointLight01.shadow) {
    //     pointLight01.shadow.bias = 1;
    // }
    pointLight01.color = new vec4([1, 1, 1, 1]);
    pointLight01.intensity = 8;
    pointLight01.range = 10;
    pointLight01.localTransform.fromTranslation(new vec3([0, 0.4, 0]));

    scene.attachChild(pointLight01);
    
    // const pointLight02 = new PointLight();
    // pointLight02.isStatic = true;
    // pointLight02.on = true;
    // pointLight02.color = new vec4([10, 10, 10, 1]);
    // pointLight02.distance = 10;
    // pointLight02.localTransform.fromTranslation(new vec3([3, 3, 3]));

    // scene.attachChild(pointLight02);
    
    // test environment probes
    addEnvProbe("envProbe01", 6, new vec3([ 0, 0, 0]), scene);
    addEnvProbe("envProbe01", 2, new vec3([ -1, -1, -1]), scene);
    addEnvProbe("envProbe02", 2, new vec3([ -1, -1,  1]), scene);
    addEnvProbe("envProbe03", 2, new vec3([ -1,  1, -1]), scene);
    addEnvProbe("envProbe04", 2, new vec3([ -1,  1,  1]), scene);
    addEnvProbe("envProbe05", 2, new vec3([  1, -1, -1]), scene);
    addEnvProbe("envProbe06", 2, new vec3([  1, -1,  1]), scene);
    addEnvProbe("envProbe07", 2, new vec3([  1,  1, -1]), scene);
    addEnvProbe("envProbe08", 2, new vec3([  1,  1,  1]), scene);

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

function addEnvProbe(name: string, size: number, position: vec3, scene: Scene) {
    const probe = new EnvironmentProbe();
    probe.name = name;
    const probesrt = new SRTTransform();
    probesrt.scaling.x = size; probesrt.scaling.y = size; probesrt.scaling.z = size;
    position.copy(probesrt.translation);
    probesrt.update();
    probesrt.transform.copy(probe.localTransform);

    scene.attachChild(probe);
}

function addPlane(name: string, matPlaneTran: mat4, matPlaneRot: mat4, wallColor: vec4, metallic: number, roughness: number, scene: Scene) {
    const planeMesh = new Mesh();
    planeMesh.name = name;
    mat4.product(matPlaneTran, matPlaneRot, planeMesh.localTransform);
    planeMesh.geometry = new PlaneGeometry(4, 4, 1, 1);
    planeMesh.castShadow = true;
    planeMesh.isStatic = true;
    const planeMtl = new StandardPBRMaterial();
    planeMtl.color = wallColor.copy();
    planeMtl.metallic = metallic;// 0.05;
    planeMtl.roughness = roughness;// 0.8;
    planeMesh.materials.push(planeMtl);
    scene.attachChild(planeMesh);
}

import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock, SphereGeometry, CylinderGeometry, PlaneGeometry, PointLight, SpotLight, DirectionalLight, DirectionalLightShadow } from "../../src/miniEngine.js";
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
    camera.localTransform.fromTranslation(new vec3([0, 0, 8]));

    // first person view controller
    const fpsBehavior = new FirstPersonViewBehavior(camera);
    camera.behaviors.push(fpsBehavior);
    fpsBehavior.position = new vec3([0, 0, 8]);
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
    boxMesh.geometry = new BoxGeometry(1, 1, 1);
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
    sphereMesh.localTransform.fromTranslation(new vec3([0, 0, 3]));
    sphereMesh.geometry = new SphereGeometry(1, 16, 8);
    sphereMesh.castShadow = true;
    sphereMesh.isStatic = false;
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
    matPlaneTran.fromTranslation(new vec3([0, -5, 0]));
    
    addPlane("floor", matPlaneTran, matPlaneRot, new vec4([1.0, 1.0, 1.0, 1.0]), scene);

    // ceiling
    matPlaneRot.fromZRotation(Math.PI);
    matPlaneTran.fromTranslation(new vec3([0, 5, 0]));

    addPlane("ceiling", matPlaneTran, matPlaneRot, new vec4([1.0, 1.0, 1.0, 1.0]), scene);

    // back wall
    matPlaneRot.fromXRotation(Math.PI * 0.5);
    matPlaneTran.fromTranslation(new vec3([0, 0, -5]));

    addPlane("backWall", matPlaneTran, matPlaneRot, new vec4([1.0, 1.0, 1.0, 1.0]), scene);

    // left wall
    matPlaneRot.fromZRotation(-Math.PI * 0.5);
    matPlaneTran.fromTranslation(new vec3([-5, 0, 0]));

    addPlane("leftWall", matPlaneTran, matPlaneRot, new vec4([1.0, 0.0, 0.0, 1.0]), scene);

    // right wall
    matPlaneRot.fromZRotation(Math.PI * 0.5);
    matPlaneTran.fromTranslation(new vec3([5, 0, 0]));
    
    addPlane("rightWall", matPlaneTran, matPlaneRot, new vec4([0.0, 1.0, 0.0, 1.0]), scene);

    // add some lights
    // test static lights first
    // todo: test point light shadow
    // and create a more complex scene which is more appropriate for test.

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

    // 测试动态光源的阴影
    const spotLight01 = new SpotLight();
    spotLight01.isStatic = true;
    spotLight01.on = true;
    spotLight01.color = new vec4([100, 100, 100, 1]);
    spotLight01.distance = 10;
    spotLight01.castShadow = true;
    // spotLight01.localTransform.fromTranslation(new vec3([0, 1, 3]));
    const spotLightLookAt = new LookatBehavior(spotLight01);
    spotLight01.behaviors.push(spotLightLookAt);
    spotLightLookAt.position = new vec3([-3, 3, 3]);
    spotLightLookAt.target = new vec3([0, 0, 0]);
    spotLightLookAt.up = new vec3([0, 1, 0]);

    scene.attachChild(spotLight01);

    const dirLight01 = new DirectionalLight();
    dirLight01.isStatic = true;
    dirLight01.on = true;
    dirLight01.color = new vec4([3,3,3,1]);
    dirLight01.radius = 5;
    dirLight01.castShadow = true;
    (dirLight01.shadow as DirectionalLightShadow).distance = 15;
    const dirLightLookAt = new LookatBehavior(dirLight01);
    dirLight01.behaviors.push(dirLightLookAt);
    dirLightLookAt.position = new vec3([5, 5, 5]);
    dirLightLookAt.target = new vec3([0, 0, 0]);
    dirLightLookAt.up = new vec3([0, 1, 0]);

    scene.attachChild(dirLight01);

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

function addPlane(name: string, matPlaneTran: mat4, matPlaneRot: mat4, wallColor: vec4, scene: Scene) {
    const ceilingMesh = new Mesh();
    ceilingMesh.name = name;
    mat4.product(matPlaneTran, matPlaneRot, ceilingMesh.localTransform);
    ceilingMesh.geometry = new PlaneGeometry(10, 10, 1, 1);
    ceilingMesh.castShadow = true;
    ceilingMesh.isStatic = true;
    const ceilingMtl = new StandardPBRMaterial();
    ceilingMtl.color = wallColor.copy();
    ceilingMtl.metallic = 0.1;
    ceilingMesh.materials.push(ceilingMtl);
    scene.attachChild(ceilingMesh);
}

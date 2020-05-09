import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial, Clock } from "../../src/miniEngine.js";
import vec3 from "../../lib/tsm/vec3.js";
import { AutoRotateBehavior } from "./autoRotateBehavior.js";

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

    // add a box geometry?
    const boxMesh = new Mesh();
    boxMesh.name = "box01";
    boxMesh.geometry = new BoxGeometry(1, 1, 1);
    // boxMesh.localTransform.fromTranslation(new vec3([0, 0, -5]));
    const material = new StandardPBRMaterial();
    boxMesh.materials.push(material);

    // auto rotate
    const autoRot = new AutoRotateBehavior(boxMesh);
    boxMesh.behaviors.push(autoRot);

    scene.attachChild(boxMesh);

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
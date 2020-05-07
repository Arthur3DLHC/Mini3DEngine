import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, StandardPBRMaterial } from "../../src/miniEngine.js";
import vec3 from "../../lib/tsm/vec3.js";

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
    scene.attachChild(camera);

    // add a box geometry?
    const boxMesh = new Mesh();
    boxMesh.name = "box01";
    boxMesh.geometry = new BoxGeometry(1, 1, 1);
    boxMesh.localTransform.fromTranslation(new vec3([0, 0, -5]));
    const material = new StandardPBRMaterial();
    boxMesh.materials.push(material);
    scene.attachChild(boxMesh);

    function gameLoop() {
        scene.updateBehavior();
        scene.updateWorldTransform(false, true);
        renderer.render(scene);
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
}
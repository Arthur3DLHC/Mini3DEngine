import { GLDevice, ClusteredForwardRenderer, Scene, PerspectiveCamera } from "../../src/miniEngine.js";

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

    function gameLoop() {
        renderer.render(scene);
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
}
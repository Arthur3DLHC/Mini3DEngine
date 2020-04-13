import { Camera } from "./camera.js";

export class PerspectiveCamera extends Camera {
    public fov: number = 60;
    public near: number = 0.1;
    public far: number = 1000;
}
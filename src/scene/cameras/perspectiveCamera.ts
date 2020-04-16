import { Camera } from "./camera.js";

export class PerspectiveCamera extends Camera {
    public constructor() {
        super();
        this.fov = 60;
        this.near = 0.1;
        this.far = 2000;
        this.focus = 10;
        this.aspect = 1;
    }
    /**
     * vertical fov, in degrees.
     */
    public fov: number;
    public near: number;
    public far: number;
    public focus: number;
    public aspect: number;

}
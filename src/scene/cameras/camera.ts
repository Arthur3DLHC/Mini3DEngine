import { Object3D } from "../object3D.js";
import { vec4 } from "gl-matrix";

export class Camera extends Object3D {
    // todo: skybox? or put skybox in scene?

    /**
     * if null. use full window.
     */
    public viewport: vec4 | null = null;
}
import { Object3D } from "../object3D.js";
import { vec4, mat4 } from "gl-matrix";

export class Camera extends Object3D {
    // todo: skybox? or put skybox in scene?

    /**
     * if null. use full window.
     */
    public viewport: vec4 | null = null;

    public near: number = 0.1;
    public far: number = 2000;

    // render target? every camera has one?

    // clear mode?
    public backgroundColor: vec4 = vec4.fromValues(0, 0, 0, 1);
    public backgroundDepth: number = 1;
    public backgroundStencil: number = 0;

    public clearColor: boolean = true;
    public clearDepth: boolean = true;
    public clearStencil: boolean = true;

    public viewTransform: mat4 = mat4.create();
    public projTransform: mat4 = mat4.create();

    public viewTransformPrev: mat4 = mat4.create();
    public projTransformPrev: mat4 = mat4.create();

    /**
     * make sure only call this once per frame
     */
    public updateViewProjTransform() {
        this.viewTransformPrev = this.viewTransform;
        mat4.invert(this.viewTransform, this.worldTransform);
        // todo: subclasses update proj transform
    }
}
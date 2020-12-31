import { Object3D } from "../object3D.js";
import vec4 from "../../../lib/tsm/vec4.js";
import mat4 from "../../../lib/tsm/mat4.js";
import vec3 from "../../../lib/tsm/vec3.js";

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
    public backgroundColor: vec4 = new vec4([0,0,0,1]);
    public backgroundDepth: number = 1;
    public backgroundStencil: number = 0;

    public clearColor: boolean = true;
    public clearDepth: boolean = true;
    public clearStencil: boolean = true;

    public viewTransform: mat4 = mat4.identity.copyTo();
    public projTransform: mat4 = mat4.identity.copyTo();

    public viewTransformPrev: mat4 = mat4.identity.copyTo();
    public projTransformPrev: mat4 = mat4.identity.copyTo();
    
    public get position(): vec3{
        return this.worldTransform.getTranslation(this._tmpPosition);
    }

    private _tmpPosition: vec3 = new vec3();

    /**
     * make sure only call this once per frame
     */
    public updateViewProjTransform() {
        this.viewTransformPrev = this.viewTransform;
        this.viewTransform = this.worldTransform.copyTo();
        this.viewTransform.inverse();
        // mat4.invert(this.viewTransform, this.worldTransform);
        // todo: subclasses update proj transform
    }
}
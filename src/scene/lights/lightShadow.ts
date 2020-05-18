import { BaseLight } from "./baseLight.js";
import { Texture2D } from "../../WebGLResources/textures/texture2D.js";
import vec2 from "../../../lib/tsm/vec2.js";
import vec4 from "../../../lib/tsm/vec4.js";
import mat4 from "../../../lib/tsm/mat4.js";

/**
 * base class for shadows
 */
export class LightShadow {
    public constructor(light: BaseLight) {
        this._light = light;
        this.bias = 0;
        this.mapSize = new vec2([256, 256]);
        this.mapRect = new vec4([0, 0, 256, 256]);
        this.shadowMap = null;
        this._matView = mat4.identity.copy();
        this._matProj = mat4.identity.copy();
    }
    
    // fustum, bias, shadowmap resolution...
    public bias: number;
    public mapSize: vec2;

    /**
     * shadowmap texture atlas location;
     * x, y, width, height
     */
    public mapRect: vec4;

    /**
     * texture. multiple lights share one texture.
     */
    public shadowMap: Texture2D | null;

    private _light: BaseLight;

    // todo: shadow matrices
    protected _matView: mat4;
    protected _matProj: mat4;

    public get matView(): mat4 {
        return this._matView;
    }

    public get matProj(): mat4 {
        return this._matProj;
    }

    public updateShadowMatrices() {
        // todo: subclass update shadow matrices according to light pose and properties
        // throw new Error("Not implemented.");
    }
}
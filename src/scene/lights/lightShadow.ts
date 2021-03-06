import { BaseLight } from "./baseLight.js";
import { Texture2D } from "../../WebGLResources/textures/texture2D.js";
import vec2 from "../../../lib/tsm/vec2.js";
import vec4 from "../../../lib/tsm/vec4.js";
import mat4 from "../../../lib/tsm/mat4.js";
import { Frustum } from "../../math/frustum.js";

/**
 * base class for shadows
 */
export class LightShadow {
    public constructor(light: BaseLight) {
        this._light = light;
        this.bias = -0.01;
        this.mapSize = new vec2([256, 256]);
        this.mapRects = [new vec4([0, 0, 256, 256])];
        this.shadowMap = null;
        this.moved = true;
        this.cached = false;
        this._matView = mat4.identity.copyTo();
        this._matProj = mat4.identity.copyTo();
        this.frustums = [new Frustum()];
    }
    
    // fustum, bias, shadowmap resolution...
    public bias: number;
    // public mapSize: vec2;
    /**
     * expected shadow map size for this shadow
     */
    public mapSize: vec2;

    /**
     * don't modify this.
     * it will be generated by shadowmapAtlas object auto.
     * shadowmap texture atlas locations;
     * x, y, width, height
     * directional light and spot light has 1 rect
     * point light has 6 rects
     */
    public mapRects: vec4[];

    public get mapSizeChanged(): boolean
    {
        return this.mapSize.x !== this.mapRects[0].z || this.mapSize.y !== this.mapRects[0].w;
    }

    /**
     * texture. multiple lights share one texture.
     */
    public shadowMap: Texture2D | null;

    /**
     * shadowmap needs update?
     * maybe moved, also maybe light properties changed
     */
    public moved: boolean;

    public cached: boolean;

    protected _light: BaseLight;

    // todo: shadow matrices
    protected _matView: mat4;
    protected _matProj: mat4;

    /**
     * directional and spot light have one frustum;
     * point light has 6 frustums;
     */
    public frustums: Frustum[];

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
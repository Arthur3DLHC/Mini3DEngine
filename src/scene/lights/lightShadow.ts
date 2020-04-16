import { vec2, vec4 } from "gl-matrix";
import { Texture } from "../../WebGLResources/texture";
import { BaseLight } from "./baseLight";

/**
 * base class for shadows
 */
export class LightShadow {
    public constructor(light: BaseLight) {
        this._light = light;
        this.bias = 0;
        this.mapSize = vec2.fromValues(256, 256);
        this.mapRect = vec4.fromValues(0, 0, 256, 256);
        this.shadowMap = null;
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
    public shadowMap: Texture | null;

    private _light: BaseLight;

    // todo: shadow matrices

    public updateShadowMatrices() {
        // todo: update shadow matrices according to light pose and properties
    }
}
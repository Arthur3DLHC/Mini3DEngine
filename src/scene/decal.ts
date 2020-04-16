import { Object3D } from "./object3D.js";
import { Texture } from "../WebGLResources/texture.js";
import { vec4 } from "gl-matrix";

export class Decal extends Object3D {
    public constructor() {
        super();
        this.texture = null;
        this.atlasRect = vec4.fromValues(0, 0, 128, 128);
    }
    // the pose and location is defined by transform matrix.

    public texture: Texture | null;
    public atlasRect: vec4;

    // todo: blend mode?
}
import { Object3D } from "./object3D.js";
import vec4 from "../../lib/tsm/vec4.js";
import { Texture2D } from "../WebGLResources/textures/texture2D.js";
import { TextureCube } from "../WebGLResources/textures/textureCube.js";

export class Scene extends Object3D {
    // todo: skybox?
    public background: vec4 | Texture2D | TextureCube | null = null;
    public backgroundIntensity: number = 1;
}
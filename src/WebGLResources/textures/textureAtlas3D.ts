import { vec3 } from "gl-matrix";
import { Texture3D } from "./texture3D";

export class TextureAtlas3D {
    public constructor() {
        this.sourceTextures = [];
        this.texture = null;
        this.imageMinCorners = [];
        this.imageMaxCorners = [];
    }

    public sourceTextures: Texture3D[];
    public imageMinCorners: vec3[] | null;
    public imageMaxCorners: vec3[] | null;
    public texture: Texture3D | null;

    public pack() {
        // todo: pack all textures in sourceTextures array and generate one altas texture.
        // after packing, the imageLocations will be filled.
    }

    public release() {
        throw new Error("Not implemented");
    }
}
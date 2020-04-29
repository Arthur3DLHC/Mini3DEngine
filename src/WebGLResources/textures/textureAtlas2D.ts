import { Texture } from "./texture";
import { vec4 } from "gl-matrix";
import { Texture2D } from "./texture2D";

export class TextureAtlas2D {
    public constructor() {
        this.sourceTextures = [];
        this.texture = null;
        this.imageLocations = [];
    }

    public sourceTextures: Texture2D[];
    public imageLocations: vec4[] | null;
    public texture: Texture2D | null;

    public pack() {
        // todo: pack all textures in sourceTextures array and generate one altas texture.
        // after packing, the imageLocations will be filled.
    }

    public release() {
        throw new Error("Not implemented");
    }
}
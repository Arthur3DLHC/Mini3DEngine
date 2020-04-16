import { Texture } from "./texture";
import { vec4 } from "gl-matrix";

export class TextureAtlas {
    public constructor() {
        this.sourceTextures = [];
        this.texture = null;
        this.imageLocations = [];
    }

    public sourceTextures: Texture[];
    public imageLocations: vec4[] | null;
    public texture: Texture | null;

    public pack() {
        // todo: pack all textures in sourceTextures array and generate one altas texture.
        // after packing, the imageLocations will be filled.
    }
}
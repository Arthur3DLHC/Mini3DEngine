import { Texture2D } from "./texture2D.js";
import vec4 from "../../../lib/tsm/vec4.js";

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
        for (const s of this.sourceTextures) {
            s.release();
        }
        this.sourceTextures.length = 0;
        if (this.texture) {
            this.texture.release();
            this.texture = null;
        }
    }
}
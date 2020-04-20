/**
 * Base class for textures
 */
export class Texture {
    public constructor() {
        this.glTexture = null;
    }

    public glTexture: WebGLTexture | null;

    public upload() {
        // base class do nothing.
        // subclass upload texture data to gl texture according to their types.
    }
}
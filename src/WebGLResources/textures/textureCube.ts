import { Texture } from "./texture.js";

export class Texture3D extends Texture {
    public constructor() {
        super();
    }

    // todo: source，长图的形式？

    public create() {
        // create gl texture
        // initialize tex by gl.TexImageCube
        throw new Error("Not implemented.");
    }
    public upload() {
        throw new Error("Not implemented.");
    }
}
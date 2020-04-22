import { Texture } from "./texture.js";

export class Texture2D extends Texture {
    public constructor() {
        super();

    }

    // todo: image source, culd be html image element
    // todo: 可以作为渲染目标；
    public create() {
        // create gl texture
        // initialize tex by gl.TexImage2D
        throw new Error("Not implemented.");
    }

    public upload() {
        throw new Error("Not implemented.");
    }
}
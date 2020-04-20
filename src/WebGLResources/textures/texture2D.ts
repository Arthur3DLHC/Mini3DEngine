import { Texture } from "./texture.js";

export class Texture2D extends Texture {
    public constructor() {
        super();

    }

    // todo: image source, culd be html image element
    // todo: 可以作为渲染目标；


    public upload() {
        throw new Error("Not implemented.");
    }
}
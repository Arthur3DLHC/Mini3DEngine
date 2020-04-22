import { Texture } from "./texture.js";

export class Texture2DArray extends Texture {
    public constructor() {
        super();
    }

    // todo: source, could be a html image element?
    // 用一个长图的形式？

    public create() {
        // create gl texture
        // initialize tex by gl.TexImage2D
        throw new Error("Not implemented.");
    }
    
    public upload() {
        throw new Error("Not implemented.");
    }
}
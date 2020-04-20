import { Texture } from "./texture.js";

export class Texture3D extends Texture {
    public constructor() {
        super();
    }

    // todo: source，长图的形式？

    // todo: 设为渲染目标

    public upload() {
        throw new Error("Not implemented.");
    }
}
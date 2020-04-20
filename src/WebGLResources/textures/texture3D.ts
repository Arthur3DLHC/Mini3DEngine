import { Texture } from "./texture.js";

export class Texture3D extends Texture {
    public constructor() {
        super();
    }

    // TODO: source，用一个长图的形式？
    // 如果是程序中生成的，则需要提供设置每个像素颜色的接口？
    // 用于生成 Irradiance volume 时；
    // 或者支持作为渲染目标？

    public upload() {
        throw new Error("Not implemented.");
    }
}
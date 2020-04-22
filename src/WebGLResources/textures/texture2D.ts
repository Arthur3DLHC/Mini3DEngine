import { Texture } from "./texture.js";
import { GLDevice } from "../glDevice.js";

export class Texture2D extends Texture {
    public constructor() {
        super();

    }

    // todo: image source, culd be html image element
    // todo: 可以作为渲染目标；
    public create() {
        // create gl texture
        if (this.glTexture) {
            throw new Error("Already created.");
        }
        this.glTexture = GLDevice.gl.createTexture();

        GLDevice.gl.bindTexture(GLDevice.gl.TEXTURE_2D, this.glTexture);

        // initialize tex by gl.TexImage2D
        GLDevice.gl.bindTexture(GLDevice.gl.TEXTURE_2D, null);

        throw new Error("Not implemented.");
    }

    public upload() {
        // todo: 检查 image source 是否合法

        if (!this.glTexture) {
            this.glTexture = GLDevice.gl.createTexture();
        }
        GLDevice.gl.bindTexture(GLDevice.gl.TEXTURE_2D, this.glTexture);

        // TODO: 向贴图中提交数据

        // initialize tex by gl.TexImage2D
        GLDevice.gl.bindTexture(GLDevice.gl.TEXTURE_2D, null);
        throw new Error("Not implemented.");
    }
}
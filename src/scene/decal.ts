import { Object3D } from "./object3D.js";
import { Texture } from "../WebGLResources/texture.js";
import { vec4 } from "gl-matrix";

export class Decal extends Object3D {
    public constructor() {
        super();
        this.texture = null;
        this.atlasRect = vec4.fromValues(0, 0, 128, 128);
    }
    // the pose and location is defined by transform matrix.

    // 在blender中用box定义decal；decal 纹理存在其材质的basecolor纹理中；
    // 读取glTF中的decal时，加载纹理，当所有decal和纹理读取完毕后，打包成图集，赋给decal对象；

    /**
     * multiple decals may be packed into one texture atlas.
     */
    public texture: Texture | null;
    public atlasRect: vec4;

    // todo: blend mode?
}
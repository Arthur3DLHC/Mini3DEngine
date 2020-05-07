import { Object3D } from "./object3D.js";
import { Texture2D } from "../WebGLResources/textures/texture2D.js";
import { BufferGeometry } from "../geometry/bufferGeometry.js";
import { RenderList } from "../renderer/renderList.js";
import vec4 from "../../lib/tsm/vec4.js";

export class Decal extends Object3D {
    public constructor() {
        super();
        this.isStatic = false;
        this.visibleDistance = 50;
        this.texture = null;
        this.atlasRect = new vec4([0, 0, 128, 128]);

        this.debugDraw = false;
        this._debugGeometry = null;
    }
    // the pose and location is defined by transform matrix.

    /**
     * the max visible distance of decal
     */
    public visibleDistance: number;

    public isStatic: boolean;

    // 在blender中用box定义decal；decal 纹理存在其材质的basecolor纹理中；
    // 读取glTF中的decal时，加载纹理，当所有decal和纹理读取完毕后，打包成图集，赋给decal对象；

    /**
     * multiple decals may be packed into one texture atlas.
     */
    public texture: Texture2D | null;
    public atlasRect: vec4;

    // todo: blend mode?

    public debugDraw: boolean;
    private _debugGeometry: BufferGeometry | null;

    public provideRenderItem(renderList: RenderList) {
        // todo: 如果开启了调试绘制模式，则输出调试图元；
    }
}
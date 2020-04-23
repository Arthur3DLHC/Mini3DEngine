import { Scene } from "../scene/scene.js";
import { RenderList } from "./renderList.js";
import { RenderContext } from "./renderContext.js";
import { Object3D } from "../scene/object3D.js";
import { Camera } from "../scene/cameras/camera.js";
import { BaseLight } from "../scene/lights/baseLight.js";
import { Mesh } from "../scene/mesh.js";
import { Decal } from "../scene/decal.js";
import { IrradianceVolume } from "../scene/irradianceVolume.js";
import { EnvironmentProbe } from "../scene/environmentProbe.js";
import { BlendState } from "../WebGLResources/renderStates/blendState.js";
import { CullState } from "../WebGLResources/renderStates/cullState.js";
import { DepthStencilState } from "../WebGLResources/renderStates/depthStencilState.js";
import { FrameBuffer } from "../WebGLResources/frameBuffer.js";
import { GLDevice } from "../WebGLResources/glDevice.js";

export class ClusteredForwardRenderer {
    public constructor() {
        this._renderListDepthPrepass = new RenderList();
        this._renderListOpaque = new RenderList();
        this._renderListTransparent = new RenderList();
        this._renderListSprites = new RenderList();
        this._tmpRenderList = new RenderList();
        this._renderContext = new RenderContext();
    }

    public render(scene: Scene) {
        this.dispatchObjects(scene);

        // todo: walk through renderlists and render items in them.
        // todo: sort the renderlists first?
    }

    private _renderListDepthPrepass: RenderList;
    private _renderListOpaque: RenderList;
    private _renderListTransparent: RenderList;
    private _renderListSprites: RenderList;
    private _tmpRenderList: RenderList;

    private _renderContext: RenderContext;

    private dispatchObjects(scene: Scene) {
        this._renderListDepthPrepass.clear();
        this._renderListOpaque.clear();
        this._renderListTransparent.clear();
        this._renderListSprites.clear();
        this._renderContext.clear();

        this.dispatchObject(scene);
    }

    private dispatchObject(object: Object3D) {

        // check visible
        if (object.visible) {
            if (object instanceof Camera) {
                this._renderContext.addCamera(object as Camera);
            } else if (object instanceof BaseLight) {
                this._renderContext.addLight(object as BaseLight);
            } else if (object instanceof Mesh) {
                // nothing to do yet.                
            } else if (object instanceof Decal) {
                this._renderContext.addDecal(object as Decal);
            } else if (object instanceof IrradianceVolume) {
                this._renderContext.addIrradianceVolume(object as IrradianceVolume);
            } else if (object instanceof EnvironmentProbe) {
                this._renderContext.addEnvironmentProbe(object as EnvironmentProbe);
            }
            this._tmpRenderList.clear();
            // 光源等也可能提供 debug 或编辑时用的显示图元
            object.provideRenderItem(this._tmpRenderList);
            // 需要遍历tmpRenderList，根据材质区分最终放到哪个 renderList 里
            // DepthPrepass: 材质没有开启半透明混合和半透明Clip
            // Opaque: 材质没有开启半透明混合
            // Transparent: 材质开启了半透明混合
            for (let index = 0; index < this._tmpRenderList.ItemCount; index++) {
                const item = this._tmpRenderList.getItemAt(index);
                if (item) {
                    if (item.material) {
                        if (item.material.blendState) {
                            if (item.material.blendState.enable) {
                                this._renderListTransparent.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                if (item.material.forceDepthPrepass) {
                                    this._renderListDepthPrepass.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                }
                            } else {
                                this._renderListOpaque.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                this._renderListDepthPrepass.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);

                            }
                        }
                    }
                }
            }
        }

        // iterate children
        for (const child of object.Children) {
            if (child !== null) {
                this.dispatchObject(child);
            }
        }
    }

}
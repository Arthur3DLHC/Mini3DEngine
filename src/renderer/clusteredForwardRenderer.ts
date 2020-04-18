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

export class ClusteredForwardRenderer {
    public constructor() {
        this.renderListDepthPrepass = new RenderList();
        this.renderListOpaque = new RenderList();
        this.renderListTransparent = new RenderList();
        this.renderListSprites = new RenderList();
        this.tmpRenderList = new RenderList();
        this.renderContext = new RenderContext();
    }

    public render(scene: Scene) {
        this.dispatchObjects(scene);

        // todo: walk through renderlists and render items in them.
        // todo: sort the renderlists first?
    }

    private renderListDepthPrepass: RenderList;
    private renderListOpaque: RenderList;
    private renderListTransparent: RenderList;
    private renderListSprites: RenderList;
    private tmpRenderList: RenderList;

    private renderContext: RenderContext;

    private dispatchObjects(scene: Scene) {
        this.renderListDepthPrepass.clear();
        this.renderListOpaque.clear();
        this.renderListTransparent.clear();
        this.renderListSprites.clear();
        this.renderContext.clear();

        this.dispatchObject(scene);
    }

    private dispatchObject(object: Object3D) {

        // check visible
        if (object.visible) {
            if (object instanceof Camera) {
                this.renderContext.addCamera(object as Camera);
            } else if (object instanceof BaseLight) {
                this.renderContext.addLight(object as BaseLight);
            } else if (object instanceof Mesh) {
                const mesh = object as Mesh;
                this.tmpRenderList.clear();
                mesh.provideRenderItem(this.tmpRenderList);
                // 需要遍历tmpRenderList，根据材质区分最终放到哪个 renderList 里
                // DepthPrepass: 材质没有开启半透明混合和半透明Clip
                // Opaque: 材质没有开启半透明混合
                // Transparent: 材质开启了半透明混合
                for (let index = 0; index < this.tmpRenderList.ItemCount; index++) {
                    const item = this.tmpRenderList.getItemAt(index);
                    if (item) {
                        if (item.material) {
                            if (item.material.blendState) {
                                if (item.material.blendState.enable) {
                                    this.renderListTransparent.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                    if (item.material.forceDepthPrepass) {
                                        this.renderListDepthPrepass.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                    }
                                } else {
                                    this.renderListOpaque.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);
                                    this.renderListDepthPrepass.addRenderItem(item.object, item.geometry, item.startIndex, item.count, item.material);

                                }
                            }
                        }
                    }
                }
            } else if (object instanceof Decal) {
                this.renderContext.addDecal(object as Decal);
            } else if (object instanceof IrradianceVolume) {
                this.renderContext.addIrradianceVolume(object as IrradianceVolume);
            } else if (object instanceof EnvironmentProbe) {
                this.renderContext.addEnvironmentProbe(object as EnvironmentProbe);
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
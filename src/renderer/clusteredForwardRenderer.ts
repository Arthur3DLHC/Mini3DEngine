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
        this.renderList = new RenderList();
        this.renderContext = new RenderContext();
    }

    public render(scene: Scene) {
        this.dispatchObjects(scene);
    }

    private renderList: RenderList;
    private renderContext: RenderContext;

    private dispatchObjects(scene: Scene) {
        this.renderList.clear();
        this.renderContext.clear();

        this.dispatchObject(scene);
    }

    private dispatchObject(object: Object3D) {

        // check visible
        if (object.visible) {
            // todo: according to object's type;
            if (object instanceof Camera) {
                this.renderContext.addCamera(object as Camera);
            } else if (object instanceof BaseLight) {
                this.renderContext.addLight(object as BaseLight);
            } else if (object instanceof Mesh) {
                const mesh = object as Mesh;
                mesh.provideRenderItem(this.renderList);
            } else if (object instanceof Decal) {
                this.renderContext.addDecal(object as Decal);
            } else if (object instanceof IrradianceVolume) {
                this.renderContext.addIrradianceVolume(object as IrradianceVolume);
            } else if (object instanceof EnvironmentProbe) {
                this.renderContext.addEnvironmentProbe(object as EnvironmentProbe);
            }

            // check culling? fix me: no camera list now.

            // should generate one renderlist per camera?

            // or use single renderlist, then check cull for every camera?
        }

        // iterate children
        for (const child of object.Children) {
            if (child !== null) {
                this.dispatchObject(child);
            }
        }
    }
}
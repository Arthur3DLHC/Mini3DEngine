import { Scene } from "../scene/scene.js";
import { RenderList } from "./renderList.js";
import { RenderContext } from "./renderContext.js";
import { Object3D } from "../scene/object3D.js";

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
        // todo: according to object's type;

        // check culling? fix me: no camera list now.

        // should generate one renderlist per camera?

        // or use single renderlist, then check cull for every camera?

        // iterate children
        for (const child of object.Children) {
            if (child !== null) {
                this.dispatchObject(child);
            }
        }
    }
}
import { GltfAsset } from "./gltfAsset.js";
import { Scene } from "../scene/scene.js";

export class GLTFSceneBuilder {
    public constructor() {

    }

    // todo: extension parser?
    // todo: custom extra parser?

    public build(gltf: GltfAsset, sceneIdx: number): Scene {
        throw new Error("Not implemented.");
    }
}
import { Object3D } from "../scene/object3D.js";
import { GltfAsset } from "./gltfAsset.js";

export abstract class GameObjectCreator {
    /**
     * gltf assets for creating the model
     */
    public gltfAssets: Map<string, GltfAsset> = new Map<string, GltfAsset>();

    /**
     * subclass implement this method to create their own game objects according to prefab key
     * @param prefabKey 
     * @param componentProps component propertys. in "componentName.propertyName": value format
     */
    public abstract createGameObject(prefabKey: string, componentProps: any): Object3D;
}
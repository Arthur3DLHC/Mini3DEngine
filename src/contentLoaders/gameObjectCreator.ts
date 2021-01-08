import quat from "../../lib/tsm/quat.js";
import vec3 from "../../lib/tsm/vec3.js";
import { PhysicsWorld } from "../physics/physicsWorld.js";
import { Object3D } from "../scene/object3D.js";
import { GltfAsset } from "./gltfAsset.js";

export abstract class GameObjectCreator {
    /**
     * gltf assets for creating the models of gameobjects
     */
    public gltfAssets: Map<string, GltfAsset> = new Map<string, GltfAsset>();

    public physicsWorld: PhysicsWorld | null = null;

    /**
     * subclass implement this method to create their own game objects according to prefab key
     * @param prefabKey 
     * @param componentProps component propertys. in "componentName.propertyName": value format
     */
    public abstract createGameObject(name: string, prefabKey: string, componentProps: any, position: vec3, rotation: quat, scale: vec3): Object3D;
}
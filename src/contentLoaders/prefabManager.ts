import { BehaviorFactory } from "../scene/behaviorFactory.js";
import { Object3D } from "../scene/object3D.js";
import { Node } from "./gltf.js";
import { GltfAsset } from "./gltfAsset.js";

export class PrefabManager {
    // register prefabs
    // fix me: use object3d or use JSON object as prefab?
    // need a behavior factory to create behaviors by type?
    // use interface?
    public prefabs: Map<string, any> = new Map<string, any>();

    /**
     * fill this map after all gltf assets loaded?
     */
    public gltfAssets: Map<string, GltfAsset> = new Map<string, GltfAsset>();

    /** 
     * the behavior factory that the app will use
     */
    public behaviorFactory: BehaviorFactory | null = null;

    // create object from prefab
    public createFromPrefab(key: string): Object3D {
        // find the prefab object with key
        // clone the object and it's all behaviors?
        const prefab = this.prefabs.get(key);
        if (prefab === undefined) {
            throw new Error("Prefab not found:" + key);
        }
        if (prefab.gltf !== undefined) {
            // need to load gltf?
            // or need to get gltf model from already loaded resources?
        }

        // const ret: Object3D = new Object3D();
        

        throw new Error("Not implemented.");
    }

    // process prefab in gltf
    public processPrefabNodeGltf(nodeDef: Node): Object3D {
        const ret = this.createFromPrefab(nodeDef.extras.prefab);
        // todo: apply properties of behaviors.
        // the behavior property format in gltf extras:
        // "behavior.property": value
        // fix me: how to find a behavior object by its type?
        return ret;
    }
}
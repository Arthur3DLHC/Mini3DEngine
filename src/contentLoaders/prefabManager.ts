import { Object3D } from "../scene/object3D.js";
import { Node } from "./gltf.js";

export class PrefabManager {
    // register prefabs
    // fix me: use object3d or use JSON object as prefab?
    // need a behavior factory to create behavior by type?
    public prefabs: Map<string, Object3D> = new Map<string, Object3D>();

    // create object from prefab
    public createFromPrefab(key: string): Object3D {
        // find the prefab object with key
        // clone the object and it's all behaviors?
        throw new Error("Not implemented.");
    }

    // process prefab in gltf
    public processPrefabNodeGltf(nodeDef: Node): Object3D {
        const ret = this.createFromPrefab(nodeDef.extras.prefab);
        // todo: apply properties of behaviors.
        // the behavior property format in gltf extras:
        // "behavior_property": value
        // fix me: how to find a behavior object by its type?
        return ret;
    }
}
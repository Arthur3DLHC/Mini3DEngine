import quat from "../../../lib/tsm/quat.js";
import vec3 from "../../../lib/tsm/vec3.js";
import { GltfAsset, Object3D, PhysicsWorld, Scene, TextureLoader } from "../../../src/mini3DEngine.js";
import { BasePrefab } from "./basePrefab.js";

export class SlicerFemalePrefab extends BasePrefab {
    public constructor(assets: Map<string, GltfAsset>, physicsWorld: PhysicsWorld, scene: Scene, textureLoader: TextureLoader, playerPhysicsMtl: CANNON.Material) {
        super(assets, physicsWorld, scene);
        this.textureLoader = textureLoader;
        this.playerPhysicsMtl = playerPhysicsMtl;
    }

    private textureLoader: TextureLoader;
    /** use same physics material with player? */
    private playerPhysicsMtl: CANNON.Material;

    public createGameObject(name: string, componentProps: any, position: vec3, rotation: quat, scale: vec3): Object3D {
        if(this.physicsWorld === null){
            throw new Error("physics world not presented.");
        }

        

        throw new Error("Method not implemented.");
    }
}
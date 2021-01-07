import { AnimationAction, ConstraintProcessor, GltfAsset, GLTFSceneBuilder, Object3D, PhysicsWorld, Scene, TextureLoader } from "../../../src/mini3DEngine.js";
import { BasePrefab } from "./basePrefab.js";

export class InfectedFemalePrefab extends BasePrefab {
    public constructor(assets: Map<string, GltfAsset>, physicsWorld: PhysicsWorld, scene: Scene, textureLoader: TextureLoader, playerPhysicsMtl: CANNON.Material) {
        super(assets, physicsWorld, scene);
        this.textureLoader = textureLoader;
        this.playerPhysicsMtl = playerPhysicsMtl;
    }

    private textureLoader: TextureLoader;
    /** use same physics material with player? */
    private playerPhysicsMtl: CANNON.Material;

    public createGameObject(componentProps: any): Object3D {
        if(this.physicsWorld === null){
            throw new Error("physics world not presented.");
        }

        const builderFemale = new GLTFSceneBuilder();
        const constraintProcssor = new ConstraintProcessor();

        builderFemale.processConstraints = constraintProcssor.processConstraintsGltf;

        const animations: AnimationAction[] = [];

        const gltfAsset = this.gltfAssets.get("infectedFemale");

        if (gltfAsset === undefined) {
            throw new Error("glTF Asset for infected female model not found.");
        }

        const gltfSceneFemale = builderFemale.build(gltfAsset, 0, animations);
        gltfSceneFemale.name = "InfectedFemale";
        gltfSceneFemale.autoUpdateTransform = true;

        // todo: location and orientation

        this.scene.attachChild(gltfSceneFemale);
        this.prepareGLTFCharacter(gltfSceneFemale);

        if (this.showMature) {
            this.setMatureSkinForCharacter(gltfSceneFemale, this.textureLoader);
        }

        throw new Error("Not implemented");
    }
}
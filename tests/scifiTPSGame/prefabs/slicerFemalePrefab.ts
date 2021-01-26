import quat from "../../../lib/tsm/quat.js";
import vec3 from "../../../lib/tsm/vec3.js";
import { ActionControlBehavior, AnimationAction, ConstraintProcessor, GltfAsset, GLTFSceneBuilder, Object3D, PhysicsWorld, RigidBody, Scene, TextureLoader } from "../../../src/mini3DEngine.js";
import { SlicerFemaleCtrlBehavoir } from "../behaviors/slicerFemaleCtrlBehavior.js";
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

        const assetKey: string = "slicerFemale";

        const { gltfSceneFemale, animations }: { gltfSceneFemale: Object3D; animations: AnimationAction[]; } = this.buildCharacterModel(assetKey, name, position, rotation);

        if (this.showMature) {
            this.setMatureSkinForCharacter(gltfSceneFemale, this.textureLoader);
        }

        // add rigid body for character
        // use a compound shape from four spheres?
        // fixed rotation?
        const femaleBody = new RigidBody(gltfSceneFemale, this.physicsWorld, { mass: 5, material: this.playerPhysicsMtl });
        this.physicsWorld.world.addBody(femaleBody.body);

        gltfSceneFemale.behaviors.push(femaleBody);

        femaleBody.body.collisionFilterGroup = 2;
        femaleBody.body.collisionFilterMask = 1 | 2;
        femaleBody.body.fixedRotation = true;
        femaleBody.affectRotation = false;

        // read RigidBody properties form component props
        this.setRigidBodyProperties(femaleBody, componentProps);

        femaleBody.setPosition(gltfSceneFemale.translation);
        femaleBody.setRotation(gltfSceneFemale.rotation);

        // use 1 sphere on every corner to represent the shape ?
        femaleBody.body.addShape(new CANNON.Sphere(0.3), new CANNON.Vec3(-0.3, 0.3, -0.3));
        femaleBody.body.addShape(new CANNON.Sphere(0.3), new CANNON.Vec3(-0.3, 0.3,  0.3));
        femaleBody.body.addShape(new CANNON.Sphere(0.3), new CANNON.Vec3( 0.3, 0.3, -0.3));
        femaleBody.body.addShape(new CANNON.Sphere(0.3), new CANNON.Vec3( 0.3, 0.3,  0.3));

        const actionCtrlBehavior = new ActionControlBehavior(gltfSceneFemale, animations);

        const slicerBehavior = new SlicerFemaleCtrlBehavoir(gltfSceneFemale, femaleBody, actionCtrlBehavior, this.scene);
        gltfSceneFemale.behaviors.push(slicerBehavior);

        // monster ctrl behavior properties
        slicerBehavior.moveSpeed = 1;
        slicerBehavior.attackingActions = 2;
        slicerBehavior.senseRange = 7;
        slicerBehavior.meleeAttackRange = 1.2;
        slicerBehavior.senseHalfFOV = Math.PI * 0.5;

        slicerBehavior.jumpHorizSpeed = 2;
        slicerBehavior.jumpVertiSpeed = 1;
        slicerBehavior.strafeSpeed = 1;

        this.addActionControlJSON(gltfSceneFemale, animations, actionCtrlBehavior);
        return gltfSceneFemale;
    }

    private addActionControlJSON(gltfSceneFemale: Object3D, animations: AnimationAction[], actionCtrlBehavior: ActionControlBehavior) {
        throw new Error("Method not implemented.");
    }
}
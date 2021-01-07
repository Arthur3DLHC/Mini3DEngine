import quat from "../../../lib/tsm/quat.js";
import vec3 from "../../../lib/tsm/vec3.js";
import { ActionControlBehavior, AnimationAction, ConstraintProcessor, GltfAsset, GLTFSceneBuilder, Object3D, PhysicsWorld, RigidBody, Scene, TextureLoader } from "../../../src/mini3DEngine.js";
import { MonsterCtrlBehavior } from "../../common/behaviors/monsterCtrlBehavior.js";
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

    public createGameObject(componentProps: any, position: vec3, rotation: quat, scale: vec3): Object3D {
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
        position.copyTo(gltfSceneFemale.translation);
        rotation.copyTo(gltfSceneFemale.rotation);

        this.scene.attachChild(gltfSceneFemale);
        this.prepareGLTFCharacter(gltfSceneFemale);

        if (this.showMature) {
            this.setMatureSkinForCharacter(gltfSceneFemale, this.textureLoader);
        }

        // add rigid body for character
        // use a compound shape from two spheres
        // fixed rotation
        const femaleBody = new RigidBody(gltfSceneFemale, this.physicsWorld, { mass: 5, material: this.playerPhysicsMtl });
        this.physicsWorld.world.addBody(femaleBody.body);

        // add rigid body last? after third person control
        gltfSceneFemale.behaviors.push(femaleBody);

        femaleBody.body.fixedRotation = true;
        femaleBody.affectRotation = false;

        femaleBody.setPosition(gltfSceneFemale.translation);
        femaleBody.setRotation(gltfSceneFemale.rotation);

        // cannon does not have capsule shape, so use some spheres...
        const femaleShapeLow = new CANNON.Sphere(0.3);
        const femaleShapeMedium = new CANNON.Sphere(0.3);
        const femaleShapeHigh = new CANNON.Sphere(0.3);

        femaleBody.body.addShape(femaleShapeLow, new CANNON.Vec3(0, 0.3, 0));
        femaleBody.body.addShape(femaleShapeMedium, new CANNON.Vec3(0, 0.85, 0));
        femaleBody.body.addShape(femaleShapeHigh, new CANNON.Vec3(0, 1.4, 0));

        const actionCtrlBehavior = new ActionControlBehavior(gltfSceneFemale, animations);

        const monsterBehavior = new MonsterCtrlBehavior(gltfSceneFemale, femaleBody, actionCtrlBehavior, this.scene);
        gltfSceneFemale.behaviors.push(monsterBehavior);
        // todo: monster ctrl behavior properties

        this.addActionControlJSON(gltfSceneFemale, animations, actionCtrlBehavior);


        throw new Error("Not implemented");
    }

    private addActionControlJSON(actor: Object3D, animations: AnimationAction[], actionCtrlBehavior: ActionControlBehavior) {
        actor.behaviors.push(actionCtrlBehavior);

        const actionCtrlDef: any = {
            "actionParams": {
                "curAction": 0
            },
            "animationLayers": [
                {
                    "name": "baseLayer",
                    "blendWeight": 1,
                    "blendMode": 1,
                    "stateMachine": {
                        "curState": "idle",
                        "states": [
                            {
                                "typeStr": "single",
                                "name": "idle",
                                "animation": "Female.Idle",
                                "animLoopMode": 0,
                                "transitions": [
                                    {
                                        "target": "walk",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 1
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "typeStr": "single",
                                "name": "walk",
                                "animation": "Female.Walk",
                                "animLoopMode": 0,
                                "transitions": [
                                    {
                                        "target": "idle",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 0
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "typeStr": "single",
                                "name": "attack01",
                                "animation": "Female.Attack.01",
                                "animLoopMode": 1,
                                "transitions": [
                                    {
                                        "target": "idle",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 0
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "typeStr": "single",
                                "name": "attack02",
                                "animation": "Female.Attack.02",
                                "animLoopMode": 1,
                                "transitions": [
                                    {
                                        "target": "idle",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 0
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "typeStr": "single",
                                "name": "attacked",
                                "animation": "Female.Damage",
                                "animLoopMode": 1,
                                "transitions": [
                                    {
                                        "target": "idle",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 0
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "typeStr": "single",
                                "name": "down",
                                "animation": "Female.Down",
                                "animLoopMode": 1,
                                "transitions": [
                                    {
                                        "target": "idle",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 0
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        };

        actionCtrlBehavior.fromJSON(actionCtrlDef);
        
        throw new Error("Method not implemented.");
    }
}
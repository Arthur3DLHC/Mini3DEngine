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

    public createGameObject(name: string, componentProps: any, position: vec3, rotation: quat, scale: vec3): Object3D {
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
        gltfSceneFemale.name = name;
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
        monsterBehavior.moveSpeed = 0.5;
        monsterBehavior.attackingActions = 2;
        monsterBehavior.senseRange = 7;
        monsterBehavior.meleeAttackRange = 0.9;
        monsterBehavior.senseHalfFOV = Math.PI * 0.5;

        this.addActionControlJSON(gltfSceneFemale, animations, actionCtrlBehavior);

        return gltfSceneFemale;
    }

    // fix me: json is too long. is it better to add states programly?
    private addActionControl(actor: Object3D, animations: AnimationAction[], actionCtrlBehavior: ActionControlBehavior) {
        throw new Error("Not implemented");
    }

    private addActionControlJSON(actor: Object3D, animations: AnimationAction[], actionCtrlBehavior: ActionControlBehavior) {
        actor.behaviors.push(actionCtrlBehavior);

        // note: actions must not transit to themselves!

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
                                    },
                                    {
                                        "target": "attack01",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 200
                                            }
                                        ]
                                    },
                                    {
                                        "target": "attack02",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 201
                                            }
                                        ]
                                    },
                                    {
                                        "target": "attacked",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 3
                                            }
                                        ]
                                    },
                                    {
                                        "target": "down",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 4
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
                                    },
                                    {
                                        "target": "attack01",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 200
                                            }
                                        ]
                                    },
                                    {
                                        "target": "attack02",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 201
                                            }
                                        ]
                                    },
                                    {
                                        "target": "attacked",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 3
                                            }
                                        ]
                                    },
                                    {
                                        "target": "down",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 4
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
                                    },
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
                                    },
                                    {
                                        "target": "attack02",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 201
                                            }
                                        ]
                                    },
                                    {
                                        "target": "attacked",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 3
                                            }
                                        ]
                                    },
                                    {
                                        "target": "down",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 4
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
                                    },
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
                                    },
                                    {
                                        "target": "attack01",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 200
                                            }
                                        ]
                                    },
                                    {
                                        "target": "attacked",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 3
                                            }
                                        ]
                                    },
                                    {
                                        "target": "down",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 4
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
                                    },
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
                                    },
                                    {
                                        "target": "attack01",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 200
                                            }
                                        ]
                                    },
                                    {
                                        "target": "attack02",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 201
                                            }
                                        ]
                                    },
                                    {
                                        "target": "down",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 4
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
                                "transitions": []   // if down, can not transit to other states?
                            }
                        ]
                    }
                }
            ]
        };

        actionCtrlBehavior.fromJSON(actionCtrlDef);
    }
}
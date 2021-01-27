import quat from "../../../lib/tsm/quat.js";
import vec3 from "../../../lib/tsm/vec3.js";
import { ActionControlBehavior, AnimationAction, GltfAsset, Object3D, PhysicsWorld, RigidBody, Scene, TextureLoader } from "../../../src/mini3DEngine.js";
import { InfectedFemaleCtrlBehavior } from "../behaviors/infectedFemaleCtrlBehavior.js";
import { ObjectCategory } from "../objectCategory.js";
import { BasePrefab } from "./basePrefab.js";

export class InfectedFemalePrefab extends BasePrefab {
    public constructor(assets: Map<string, GltfAsset>, physicsWorld: PhysicsWorld, scene: Scene, textureLoader: TextureLoader, playerPhysicsMtl: CANNON.Material) {
        super(assets, physicsWorld, scene);
        this.textureLoader = textureLoader;
        this.playerPhysicsMtl = playerPhysicsMtl;

        this.category = ObjectCategory.ENEMIES;
    }

    private textureLoader: TextureLoader;
    /** use same physics material with player? */
    private playerPhysicsMtl: CANNON.Material;

    public createGameObject(name: string, componentProps: any, position: vec3, rotation: quat, scale: vec3): Object3D {
        if(this.physicsWorld === null){
            throw new Error("physics world not presented.");
        }

        const assetKey: string = "infectedFemale";

        const { gltfSceneFemale, animations }: { gltfSceneFemale: Object3D; animations: AnimationAction[]; } = this.buildCharacterModel(assetKey, name, position, rotation);

        if (this.showMature) {
            this.setMatureSkinForCharacter(gltfSceneFemale, this.textureLoader);
        }

        // add rigid body for character
        // use a compound shape from three spheres
        // fixed rotation
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

        // cannon does not have capsule shape, so use some spheres...
        const femaleShapeLow = new CANNON.Sphere(0.3);
        const femaleShapeMedium = new CANNON.Sphere(0.3);
        const femaleShapeHigh = new CANNON.Sphere(0.3);

        femaleBody.body.addShape(femaleShapeLow, new CANNON.Vec3(0, 0.3, 0));
        femaleBody.body.addShape(femaleShapeMedium, new CANNON.Vec3(0, 0.85, 0));
        femaleBody.body.addShape(femaleShapeHigh, new CANNON.Vec3(0, 1.4, 0));

        const actionCtrlBehavior = new ActionControlBehavior(gltfSceneFemale, animations);

        const monsterBehavior = new InfectedFemaleCtrlBehavior(gltfSceneFemale, femaleBody, actionCtrlBehavior, this.scene);
        gltfSceneFemale.behaviors.push(monsterBehavior);
        // monster ctrl behavior properties
        monsterBehavior.moveSpeed = 0.5;
        monsterBehavior.attackingActions = 2;
        monsterBehavior.senseRange = 7;
        monsterBehavior.meleeAttackRange = 0.9;
        monsterBehavior.senseHalfFOV = Math.PI * 0.5;

        this.addActionControlJSON(gltfSceneFemale, actionCtrlBehavior);
        monsterBehavior.upperBodyLayer = actionCtrlBehavior.animationLayers.find((layer)=>{return layer.name === "upperBody"});
        // prevent state machine cannot change state if weight is 0
        if(monsterBehavior.upperBodyLayer) monsterBehavior.upperBodyLayer.alwaysUpdate = true;

        return gltfSceneFemale;
    }




    private addActionControlJSON(actor: Object3D, actionCtrlBehavior: ActionControlBehavior) {
        actor.behaviors.push(actionCtrlBehavior);

        // note: actions must not transit to themselves!

        // todo: use a masked animation level for damage state?

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
                                        "duration": 0.5,
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
                                    // {
                                    //     "target": "attacked",
                                    //     "conditions": [
                                    //         {
                                    //             "typeStr": "singleParam",
                                    //             "paramName": "curAction",
                                    //             "compareOp": "===",
                                    //             "compareValue": 3
                                    //         }
                                    //     ]
                                    // },
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
                                        "duration": 0.5,
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
                                        "duration": 0.2,
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
                                        "duration": 0.2,
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 201
                                            }
                                        ]
                                    },
                                    // {
                                    //     "target": "attacked",
                                    //     "conditions": [
                                    //         {
                                    //             "typeStr": "singleParam",
                                    //             "paramName": "curAction",
                                    //             "compareOp": "===",
                                    //             "compareValue": 3
                                    //         }
                                    //     ]
                                    // },
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
                                        "duration": 0.5,
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
                                    // {
                                    //     "target": "attacked",
                                    //     "conditions": [
                                    //         {
                                    //             "typeStr": "singleParam",
                                    //             "paramName": "curAction",
                                    //             "compareOp": "===",
                                    //             "compareValue": 3
                                    //         }
                                    //     ]
                                    // },
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
                                        "duration": 0.5,
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
                                    // {
                                    //     "target": "attacked",
                                    //     "conditions": [
                                    //         {
                                    //             "typeStr": "singleParam",
                                    //             "paramName": "curAction",
                                    //             "compareOp": "===",
                                    //             "compareValue": 3
                                    //         }
                                    //     ]
                                    // },
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
                },
                {
                    "name": "upperBody",
                    "blendWeight": 0,
                    "blendMode": 1,
                    "mask": {
                        "joints": [
                            {
                                // "path": "spine.001",
                                "name": "spine.001",
                                "recursive": true,
                            },
                            {
                                // "path": "spine.IK",
                                "name": "spine.IK",
                                "recursive": true,
                            }
                        ]
                    },
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
                                        "target": "attacked.light",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 300
                                            }
                                        ]
                                    },
                                    {
                                        "target": "attacked.heavy",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 301
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "typeStr": "single",
                                "name": "attacked.light",
                                "animation": "Female.Damage.Light",
                                "animLoopMode": 1,
                                "transitions": [
                                    {
                                        "target": "idle",
                                        "duration": 0.5,
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "!==",
                                                "compareValue": 300
                                            }
                                        ]
                                    },
                                ]
                            },
                            {
                                "typeStr": "single",
                                "name": "attacked.heavy",
                                "animation": "Female.Damage.Heavy",
                                "animLoopMode": 1,
                                "transitions": [
                                    {
                                        "target": "idle",
                                        "duration": 0.5,
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "!==",
                                                "compareValue": 301
                                            }
                                        ]
                                    },
                                ]
                            }
                        ]
                    }
                }
            ]
        };

        actionCtrlBehavior.fromJSON(actionCtrlDef);
    }
}
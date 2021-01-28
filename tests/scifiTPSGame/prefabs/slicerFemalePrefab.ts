import quat from "../../../lib/tsm/quat.js";
import vec3 from "../../../lib/tsm/vec3.js";
import { ActionControlBehavior, AnimationAction, GltfAsset, Object3D, PhysicsWorld, RigidBody, Scene, TextureLoader } from "../../../src/mini3DEngine.js";
import { SlicerFemaleCtrlBehavoir } from "../behaviors/slicerFemaleCtrlBehavior.js";
import { ObjectCategory } from "../objectCategory.js";
import { BasePrefab } from "./basePrefab.js";

export class SlicerFemalePrefab extends BasePrefab {
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

        const assetKey: string = "slicerFemale";

        const { gltfSceneFemale, animations }: { gltfSceneFemale: Object3D; animations: AnimationAction[]; } = this.buildCharacterModel(assetKey, name, position, rotation);

        if (this.showMature) {
            this.setMatureSkinForCharacter(gltfSceneFemale, this.textureLoader);
        }

        // add rigid body for character
        // use a compound shape from four spheres?
        // fixed rotation?
        const femaleBody = new RigidBody(gltfSceneFemale, this.physicsWorld, { mass: 0.5, material: this.playerPhysicsMtl });
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
        femaleBody.body.addShape(new CANNON.Sphere(0.6), new CANNON.Vec3(0.0, 0.6, 0.0));
        // femaleBody.body.addShape(new CANNON.Sphere(0.3), new CANNON.Vec3(-0.3, 0.3,  0.3));
        // femaleBody.body.addShape(new CANNON.Sphere(0.3), new CANNON.Vec3( 0.3, 0.3, -0.3));
        // femaleBody.body.addShape(new CANNON.Sphere(0.3), new CANNON.Vec3( 0.3, 0.3,  0.3));

        const actionCtrlBehavior = new ActionControlBehavior(gltfSceneFemale, animations);

        const slicerBehavior = new SlicerFemaleCtrlBehavoir(gltfSceneFemale, femaleBody, actionCtrlBehavior, this.scene);
        gltfSceneFemale.behaviors.push(slicerBehavior);

        // monster ctrl behavior properties
        slicerBehavior.moveSpeed = 1;
        slicerBehavior.attackingActions = 2;
        slicerBehavior.senseRange = 7;
        slicerBehavior.meleeAttackRange = 1.2;
        slicerBehavior.senseHalfFOV = Math.PI * 0.5;

        slicerBehavior.jumpHorizSpeed = 5;
        slicerBehavior.jumpVertiSpeed = 5;
        slicerBehavior.strafeSpeed = 2;

        this.addActionControlJSON(gltfSceneFemale, actionCtrlBehavior);
        return gltfSceneFemale;
    }

    private addActionControlJSON(actor: Object3D, actionCtrlBehavior: ActionControlBehavior) {
        actor.behaviors.push(actionCtrlBehavior);
        
        const actionCtrlDef: any = {
            "actionParams": {
                "curAction": 0,
                "ySpeed": -1
            },
            "animationLayers": [
                {
                    name: "baseLayer",
                    "blendWeight": 1,
                    "blendMode": 1,
                    "stateMachine": {
                        "curState": "idle",
                        "states": [
                            // idle
                            {
                                "typeStr": "single",
                                "name": "idle",
                                "animation": "Female.Idle",
                                "animLoopMode": 0,
                                "transitions": [
                                    {
                                        "target": "moveForward",
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
                                        "target": "strafeLeft",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 2
                                            }
                                        ]
                                    },
                                    {
                                        "target": "strafeRight",
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
                                        "target": "attackFront",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 4
                                            }
                                        ]
                                    },
                                    {
                                        "target": "attackBack",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 5
                                            }
                                        ]
                                    },
                                    {
                                        "target": "damageLight",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 600
                                            }
                                        ]
                                    },
                                    {
                                        "target": "damageHeavy",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 601
                                            }
                                        ]
                                    },
                                    {
                                        "target": "jump",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 7
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
                                                "compareValue": 8
                                            }
                                        ]
                                    },
                                ]
                            },
                            // moveForward
                            {
                                "typeStr": "single",
                                "name": "moveForward",
                                "animation": "Female.Crawl",
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
                                        "target": "strafeLeft",
                                        "duration": 0.2,
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 2
                                            }
                                        ]
                                    },
                                    {
                                        "target": "strafeRight",
                                        "duration": 0.2,
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
                                        "target": "attackFront",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 4
                                            }
                                        ]
                                    },
                                    {
                                        "target": "attackBack",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 5
                                            }
                                        ]
                                    },
                                    {
                                        "target": "damageLight",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 600
                                            }
                                        ]
                                    },
                                    {
                                        "target": "damageHeavy",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 601
                                            }
                                        ]
                                    },
                                    {
                                        "target": "jump",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 7
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
                                                "compareValue": 8
                                            }
                                        ]
                                    },
                                ]
                            },
                            // strafe left
                            {
                                "typeStr": "single",
                                "name": "strafeLeft",
                                "animation": "Female.Strafe.Left",
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
                                        "target": "moveForward",
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
                                        "target": "damageLight",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 600
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
                                                "compareValue": 8
                                            }
                                        ]
                                    },
                                ]
                            },
                            // strafe right
                            {
                                "typeStr": "single",
                                "name": "strafeRight",
                                "animation": "Female.Strafe.Right",
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
                                        "target": "moveForward",
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
                                        "target": "damageLight",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 600
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
                                                "compareValue": 8
                                            }
                                        ]
                                    },
                                ]
                            },
                            // jump
                            {
                                "typeStr": "blendTree",
                                "name": "jump",
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
                                        "target": "moveForward",
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
                                        "target": "damageHeavy",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 601
                                            }
                                        ]
                                    },
                                ],
                                "rootNode": {
                                    "blendParameters": ["ySpeed"],
                                    "blendMethod": 0,
                                    "weight": 1,
                                    "children": [
                                        {
                                            // jump up
                                            "blendMethod": 4,
                                            "weigth": 0,
                                            "weightParamPosition": [1],
                                            "animation": "Female.Jump.Up",
                                            "animLoopMode": 1
                                        },
                                        {
                                            // fall down
                                            "blendMethod": 4,
                                            "weigth": 0,
                                            "weightParamPosition": [-1],
                                            "animation": "Female.Fall.Down",
                                            "animLoopMode": 1
                                        }
                                    ]
                                }
                            },
                            // attack forward
                            {
                                "typeStr": "single",
                                "name": "attackFront",
                                "animation": "Female.Attack.001",
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
                                        "target": "damageLight",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 600
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
                                                "compareValue": 8
                                            }
                                        ]
                                    },
                                ]    
                            },
                            // attack backward
                            {
                                "typeStr": "single",
                                "name": "attackBack",
                                "animation": "Female.Attack.002",
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
                                        "target": "damageLight",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 600
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
                                                "compareValue": 8
                                            }
                                        ]
                                    },
                                ]    
                            },
                            // damaged light
                            {
                                "typeStr": "single",
                                "name": "damageLight",
                                "animation": "Female.Damage.Light",
                                "animLoopMode": 1,
                                "transitions": [
                                    {
                                        "target": "moveForward",
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
                                        "target": "down",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 8
                                            }
                                        ]
                                    },
                                ]    
                            },
                            // damaged heavy
                            {
                                "typeStr": "single",
                                "name": "damageHeavy",
                                "animation": "Female.Damage.Heavy",
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
                                        "target": "moveForward",
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
                                        "target": "down",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "curAction",
                                                "compareOp": "===",
                                                "compareValue": 8
                                            }
                                        ]
                                    },
                                ]    
                            },
                            // down
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
        }

        actionCtrlBehavior.fromJSON(actionCtrlDef);
    }
}
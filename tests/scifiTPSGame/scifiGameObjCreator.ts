import vec3 from "../../lib/tsm/vec3.js";
import { ActionControlBehavior, AnimationAction, ConstraintProcessor, GameObjectCreator, GLTFSceneBuilder, Mesh, Object3D, PerspectiveCamera, PhysicsWorld, RigidBody, Scene, StandardPBRMaterial, Texture, TextureLoader } from "../../src/mini3DEngine.js";
import { TPSPlayerBehavior } from "./tpsPlayerBehavior.js";

export class SciFiGameObjCreator extends GameObjectCreator {
    public constructor(physicsWorld: PhysicsWorld, camera: PerspectiveCamera, scene: Scene, textureLoader: TextureLoader) {
        super();

        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.camera = camera;
        this.textureLoader = textureLoader;

        this.playerPhysicsMtl = new CANNON.Material("playerMaterial");
        this.groundPhysicsMtl = new CANNON.Material("groundMaterial");
        this.widgetPhysicsMtl = new CANNON.Material("widgetMaterial");
        
        const player_ground_cm = new CANNON.ContactMaterial(this.playerPhysicsMtl, this.groundPhysicsMtl,
             { friction: 0.0, restitution: 0.3, contactEquationRelaxation: 3, contactEquationStiffness: 1e8, frictionEquationStiffness: 1e8, frictionEquationRelaxation: 3 });
        const player_widget_cm = new CANNON.ContactMaterial(this.playerPhysicsMtl, this.widgetPhysicsMtl,
             { friction: 0.4, restitution: 0.3, contactEquationRelaxation: 3, contactEquationStiffness: 1e8, frictionEquationStiffness: 1e8, frictionEquationRelaxation: 3 });
        const widget_ground_cm = new CANNON.ContactMaterial(this.widgetPhysicsMtl, this.groundPhysicsMtl,
             { friction: 0.4, restitution: 0.3, contactEquationRelaxation: 3, contactEquationStiffness: 1e8, frictionEquationStiffness: 1e8, frictionEquationRelaxation: 3 });
        
        this.physicsWorld.world.addContactMaterial(player_ground_cm);
        this.physicsWorld.world.addContactMaterial(player_widget_cm);
        this.physicsWorld.world.addContactMaterial(widget_ground_cm);
    }
    private playerPhysicsMtl: CANNON.Material;
    private groundPhysicsMtl: CANNON.Material;
    private widgetPhysicsMtl: CANNON.Material;

    private scene: Scene;
    private camera: PerspectiveCamera;
    private textureLoader: TextureLoader;

    public showMature: boolean = false;

    public createGameObject(prefabKey: string, componentProps: any): Object3D {
        switch(prefabKey) {
            case "player":
                return this.createPlayer(componentProps);
            case "infectedFemale":
                return this.createInfectedFemale(componentProps);
        }
        throw new Error("Unrecogonized prefab: " + prefabKey);
    }

    createPlayer(componentProps: any): Object3D {
        if(this.physicsWorld === null){
            throw new Error("physics world not presented.");
        }

        const builderFemale = new GLTFSceneBuilder();
        const constraintProcssor = new ConstraintProcessor();

        builderFemale.processConstraints = constraintProcssor.processConstraintsGltf;

        const animations: AnimationAction[] = [];

        const gltfAsset = this.gltfAssets.get("playerFemale");

        if (gltfAsset === undefined) {
            throw new Error("glTF Asset for player model not found.");
        }

        const gltfSceneFemale = builderFemale.build(gltfAsset, 0, animations);
        gltfSceneFemale.name = "Female";
        gltfSceneFemale.autoUpdateTransform = true;

        // todo: place the player on location of nodeDef？
        gltfSceneFemale.translation.y = 1.5;  // for robot maintance area level

        // add to scene, not level
        this.scene.attachChild(gltfSceneFemale);

        this.prepareGLTFCharacter(gltfSceneFemale);

        if (this.showMature) {
            this.setMatureSkinForCharacter(gltfSceneFemale);
        }

        // and add rigid body for player character
        // use a compound shape from two spheres
        // fixed rotation
        const playerBody = new RigidBody(gltfSceneFemale, this.physicsWorld, { mass: 5, material: this.playerPhysicsMtl });
        this.physicsWorld.world.addBody(playerBody.body);

        // add rigid body last? after third person control
        gltfSceneFemale.behaviors.push(playerBody);

        playerBody.body.fixedRotation = true;
        playerBody.affectRotation = false;

        playerBody.setPosition(gltfSceneFemale.translation);
        playerBody.setRotation(gltfSceneFemale.rotation);

        // cannon does not have capsule shape, so use some spheres...
        const playerShapeLow = new CANNON.Sphere(0.3);
        const playerShapeMedium = new CANNON.Sphere(0.3);
        const playerShapeHigh = new CANNON.Sphere(0.3);

        // playerBody.body.addShape(playerShapeLow, new CANNON.Vec3(0, -0.55, 0));
        // playerBody.body.addShape(playerShapeMedium, new CANNON.Vec3(0, 0, 0));
        // playerBody.body.addShape(playerShapeHigh, new CANNON.Vec3(0, 0.55, 0));

        // NOTE: if use a animated character model load from gltf, the offsets should be:

        playerBody.body.addShape(playerShapeLow, new CANNON.Vec3(0, 0.3, 0));
        playerBody.body.addShape(playerShapeMedium, new CANNON.Vec3(0, 0.85, 0));
        playerBody.body.addShape(playerShapeHigh, new CANNON.Vec3(0, 1.4, 0));

        const actionCtrlBehavior = new ActionControlBehavior(gltfSceneFemale, animations);

        // first person view controller
        // todo: use third person controller
        const tpsBehavior = new TPSPlayerBehavior(gltfSceneFemale, playerBody, this.camera, actionCtrlBehavior);
        gltfSceneFemale.behaviors.push(tpsBehavior);
        tpsBehavior.cameraVerticalOffset = 1.5;
        tpsBehavior.cameraHorizontalOffset = new vec3([0.4, 0, 1.5]);
        tpsBehavior.cameraHorizontalOffsetScale = 0.5;
        tpsBehavior.moveSpeed = 2;
        tpsBehavior.aimMoveSpeed = 0.6;
        tpsBehavior.pointerLock = false;
        
        // todo: create animation control behavior
        // animation layer, state machine (manually / json)
        // addActionControl(gltfSceneFemale, animations, actionCtrlBehavior);
        this.addPlayerActionControlJSON(gltfSceneFemale, animations, actionCtrlBehavior);

        tpsBehavior.upperBodyLayer = actionCtrlBehavior.animationLayers.find((layer)=>{return layer.name === "upperBody";});

        return gltfSceneFemale;
    }
    createInfectedFemale(componentProps: any): Object3D {
        throw new Error("Method not implemented.");
    }

    private prepareGLTFCharacter(gltfNode: Object3D) {
        // gltfNode.isStatic = true;
        gltfNode.isStatic = false;
        gltfNode.autoUpdateTransform = true;
        
        if (gltfNode instanceof Mesh) {
            gltfNode.castShadow = true;
            gltfNode.receiveShadow = true;
            // gltfNode.boundingSphereRenderMode = BoundingRenderModes.normal;
        }

        for (const child of gltfNode.children) {
            this.prepareGLTFCharacter(child);
        }
    }

    private setMatureSkinForCharacter(gltfNode: Object3D) {
        if (gltfNode instanceof Mesh) {
            const mesh = gltfNode as Mesh;
            const skinMtl = mesh.materials.find((mtl)=>{return mtl.name === "Material.Skin.001"});
            if (skinMtl !== undefined && skinMtl instanceof StandardPBRMaterial) {
                const pbrSkinMtl = skinMtl as StandardPBRMaterial;
                // load texture?
                const texturePromise: Promise<Texture> = this.textureLoader.loadPromise("./models/SCIFI/heroes/cyberGirl/SkinBaseColor_NSFW.png");
                texturePromise.then((skinTex) => {
                    pbrSkinMtl.colorMap = skinTex;
                });
                return;
            }
        }

        for (const child of gltfNode.children) {
            this.setMatureSkinForCharacter(child);
        }
    }

    private addPlayerActionControlJSON(actor: Object3D, animations: AnimationAction[], actionCtrlBehavior: ActionControlBehavior) {
        actor.behaviors.push(actionCtrlBehavior);

        const actionCtrlDef: any = {
            "actionParams": {
                "aiming": 0,
                "aimPitch": 0,
                "moveSpeed": 0,
                "strafeSpeed": 0,
                "shoot": 0,
                "gotHit": 0,
                "down": 0,
            },
            "animationLayers": [
                {
                    "name": "baseLayer",
                    "blendWeight": 1,
                    "blendMode": 1,
                    "stateMachine": {
                        "curState": "tpsTree",
                        "states": [
                            {
                                "typeStr": "blendTree",
                                "name": "tpsTree",
                                "rootNode": {
                                    "blendParameters": ["aiming"],
                                    "blendMethod": 0,
                                    "weight": 1,
                                    "children": [
                                        /*
                                        {
                                            // aiming move (front back only)
                                            "blendParameters": ["moveSpeed"],
                                            "blendMethod": 0,
                                            "weigth": 0,
                                            "weightParamPosition": [1],
                                            "children": [
                                                {
                                                    // aim move backward
                                                    "blendMethod": 4,
                                                    "weigth": 0,
                                                    "weightParamPosition": [-1],
                                                    "animation": "Female.Aim.Walk.Backward"
                                                },
                                                {
                                                    // aim stand
                                                    "blendMethod": 4,
                                                    "weigth": 1,
                                                    "weightParamPosition": [0],
                                                    "animation": "Female.Aim.Middle"
                                                },
                                                {
                                                    // aim move forward
                                                    "blendMethod": 4,
                                                    "weigth": 0,
                                                    "weightParamPosition": [1],
                                                    "animation": "Female.Aim.Walk.Forward"
                                                },
                                            ]
                                        },
                                        */
                                        {
                                            // aiming move (directional)
                                            "blendParameters": ["strafeSpeed", "moveSpeed"],
                                            "blendMethod": 1,
                                            "weigth": 0,
                                            "weightParamPosition": [1], // aiming === 1
                                            "children": [
                                                {
                                                    // aim move backward
                                                    "blendMethod": 4,
                                                    "weigth": 0,
                                                    "weightParamPosition": [0, -1],
                                                    "animation": "Female.Aim.Walk.Backward"
                                                },
                                                {
                                                    // aim stand
                                                    "blendMethod": 4,
                                                    "weigth": 1,
                                                    "weightParamPosition": [0, 0],
                                                    "animation": "Female.Aim.Middle"
                                                },
                                                {
                                                    // aim move forward
                                                    "blendMethod": 4,
                                                    "weigth": 0,
                                                    "weightParamPosition": [0, 1],
                                                    "animation": "Female.Aim.Walk.Forward"
                                                },
                                                {
                                                    // aim strafe left
                                                    "blendMethod": 4,
                                                    "weigth": 0,
                                                    "weightParamPosition": [-1, 0],
                                                    "animation": "Female.Aim.Walk.Left"
                                                },
                                                {
                                                    // aim strafe right
                                                    "blendMethod": 4,
                                                    "weigth": 0,
                                                    "weightParamPosition": [1, 0],
                                                    "animation": "Female.Aim.Walk.Right"
                                                },
                                            ]
                                        },
                                        {
                                            // not aiming
                                            "blendParameters": ["moveSpeed"],
                                            "blendMethod": 0,
                                            "weigth": 1,
                                            "weightParamPosition": [0],
                                            "children": [
                                                {
                                                    // idle
                                                    "blendMethod": 4,
                                                    "weigth": 1,
                                                    "weightParamPosition": [0],
                                                    "animation": "Female.Idle"
                                                },
                                                {
                                                    // jog
                                                    "blendMethod": 4,
                                                    "weigth": 0,
                                                    "weightParamPosition": [1],
                                                    "animation": "Female.Jog"
                                                }
                                            ]
                                        }
                                    ]
                                }
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
                        "curState": "upperAimTree",
                        "states": [
                            {
                                "typeStr": "blendTree",
                                "name": "upperAimTree",
                                "transitions": [
                                    {
                                        "target": "upperShootTree",
                                        "conditions": [
                                            {
                                                "typeStr": "singleParam",
                                                "paramName": "shoot",
                                                "compareOp": "===",
                                                "compareValue": 1
                                            }
                                        ]
                                    }
                                ],
                                "rootNode": {
                                    "blendParameters": ["aimPitch"],
                                    "blendMethod": 0,
                                    "weight": 1,
                                    "children": [
                                        {
                                            // aim down
                                            "blendMethod": 4,
                                            "weigth": 0,
                                            "weightParamPosition": [-1],
                                            "animation": "Female.Aim.Down"
                                        },
                                        {
                                            // aim middle
                                            "blendMethod": 4,
                                            "weigth": 1,
                                            "weightParamPosition": [0],
                                            "animation": "Female.Aim.Middle"
                                        },
                                        {
                                            // aim up
                                            "blendMethod": 4,
                                            "weigth": 0,
                                            "weightParamPosition": [1],
                                            "animation": "Female.Aim.Up"
                                        }
                                    ]
                                }
                            },
                            {
                                "typeStr": "blendTree",
                                "name": "upperShootTree",
                                "transitions": [
                                    {
                                        "target": "upperAimTree",
                                        "conditions": [
                                            {
                                                "typeStr": "timeUp",
                                                "duration": 0.5,
                                            }
                                        ]
                                    }
                                ],
                                "rootNode": {
                                    "blendParameters": ["aimPitch"],
                                    "blendMethod": 0,
                                    "weight": 1,
                                    "children": [
                                        {
                                            // shoot down
                                            "blendMethod": 4,
                                            "weigth": 0,
                                            "weightParamPosition": [-1],
                                            "animation": "Female.Shoot.Down",
                                            "animLoopMode": 0
                                        },
                                        {
                                            // shoot middle
                                            "blendMethod": 4,
                                            "weigth": 1,
                                            "weightParamPosition": [0],
                                            "animation": "Female.Shoot.Middle",
                                            "animLoopMode": 0
                                        },
                                        {
                                            // shoot up
                                            "blendMethod": 4,
                                            "weigth": 0,
                                            "weightParamPosition": [1],
                                            "animation": "Female.Shoot.Up",
                                            "animLoopMode": 0
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        };

        actionCtrlBehavior.fromJSON(actionCtrlDef);
    }
}
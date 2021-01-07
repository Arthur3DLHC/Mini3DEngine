import vec3 from "../../../lib/tsm/vec3.js";
import { ActionControlBehavior, ActionStateBlendTree, ActionStateMachine, ActionTransition, AnimationAction, AnimationBlendNode, AnimationLayer, AnimationLoopMode, AnimationMask, BlendMethods, Camera, ConstraintProcessor, GltfAsset, GLTFSceneBuilder, Object3D, PerspectiveCamera, PhysicsWorld, RigidBody, Scene, SingleParamCondition, TextureLoader, TimeUpCondition } from "../../../src/mini3DEngine.js";
import { TPSPlayerBehavior } from "../tpsPlayerBehavior.js";
import { BasePrefab } from "./basePrefab.js";

/**
 * class to create player gameobject
 */
export class PlayerPrefab extends BasePrefab {
    public constructor(assets: Map<string, GltfAsset>, physicsWorld: PhysicsWorld, scene: Scene, camera: PerspectiveCamera, textureLoader: TextureLoader, playerPhysicsMtl: CANNON.Material) {
        super(assets, physicsWorld, scene);

        this.camera = camera;
        this.textureLoader = textureLoader;
        this.playerPhysicsMtl = playerPhysicsMtl;
    }

    private camera: PerspectiveCamera;
    private textureLoader: TextureLoader;

    private playerPhysicsMtl: CANNON.Material;


    public createGameObject(componentProps: any): Object3D {
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
            this.setMatureSkinForCharacter(gltfSceneFemale, this.textureLoader);
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

        window.onmousedown = (ev: MouseEvent) => {
            // fpsBehavior.onMouseDown(ev);
            if (tpsBehavior !== null) tpsBehavior.onMouseDown(ev);
        }

        window.onmouseup = (ev: MouseEvent) => {
            // fpsBehavior.onMouseUp(ev);
            if (tpsBehavior !== null) tpsBehavior.onMouseUp(ev);
        }

        window.onmousemove = (ev: MouseEvent) => {
            // fpsBehavior.onMouseMove(ev);
            if (tpsBehavior !== null) tpsBehavior.onMouseMove(ev);
        }

        window.onwheel = (ev: WheelEvent) => {
            ev.preventDefault();
            if (tpsBehavior !== null) tpsBehavior.onMouseWheel(ev);
        }

        window.onkeydown = (ev: KeyboardEvent) => {
            // fpsBehavior.onKeyDown(ev);
            if (tpsBehavior !== null) tpsBehavior.onKeyDown(ev);
        }

        window.onkeyup = (ev: KeyboardEvent) => {
            // fpsBehavior.onKeyUp(ev);
            if (tpsBehavior !== null) tpsBehavior.onKeyUp(ev);
        }

        return gltfSceneFemale;
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

    private addActionControl(actor: Object3D, animations: AnimationAction[], actionCtrlBehavior: ActionControlBehavior)  {
        actor.behaviors.push(actionCtrlBehavior);

        // 0 - not aiming; 1 - aiming
        actionCtrlBehavior.actionParams.set("aiming", 0.0);
        // -1 - aim down; 0 - aim strait; 1 - aim up
        actionCtrlBehavior.actionParams.set("aimPitch", 0.0);
        // -1 - move backward (aiming only); 0 - idle; 1 - move forward
        actionCtrlBehavior.actionParams.set("moveSpeed", 0.0);
        // 0 - not shooting; 1 - shooting
        actionCtrlBehavior.actionParams.set("shoot", 0.0);

        const baseLayer = new AnimationLayer();
        actionCtrlBehavior.animationLayers.push(baseLayer);
        baseLayer.name = "baseLayer";
        baseLayer.blendWeight = 1;

        // state machine
        baseLayer.stateMachine = new ActionStateMachine(actionCtrlBehavior, baseLayer);

        // use only 1 blendtree?
        const blendTree = new ActionStateBlendTree("tpsTree", baseLayer.stateMachine);
        baseLayer.stateMachine.addState(blendTree);

        // root node
        //      |- aiming
        //      |   |- aiming idle
        //      |   |- aiming move forward
        //      |   |- aiming move backward
        //      |
        //      |- not aiming
        //          |- idle
        //          |- walk
        //          |- jog
        blendTree.rootNode = new AnimationBlendNode(blendTree, ["aiming"], BlendMethods.Simple1D, undefined, 1);

        // aiming == 1
        const aimingNode = new AnimationBlendNode(blendTree, ["moveSpeed"], BlendMethods.Simple1D, [1], 0);
        blendTree.rootNode.addChild(aimingNode);
        
        // moveSpeed == -1
        const aimingBackwardNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [-1], 0, this.getAnimationByName(animations, "Female.Aim.Walk.Backward"));
        aimingNode.addChild(aimingBackwardNode);

        // moveSpeed == 0
        const aimingIdleNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [0], 1,  this.getAnimationByName(animations, "Female.Aim.Middle"));
        aimingNode.addChild(aimingIdleNode);

        // moveSpeed == 1
        const aimingForwardNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [1], 0, this.getAnimationByName(animations, "Female.Aim.Walk.Forward"));
        aimingNode.addChild(aimingForwardNode);

        // aiming == 0
        const notAimingNode = new AnimationBlendNode(blendTree, ["moveSpeed"], BlendMethods.Simple1D, [0], 1);
        blendTree.rootNode.addChild(notAimingNode);

        // moveSpeed == 0
        const idleNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [0], 1, this.getAnimationByName(animations, "Female.Idle"));
        notAimingNode.addChild(idleNode);

        // moveSpeed == 0.5
        // const walkNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [0.5], 0, getAnimationByName(animations, "Female.Walk"));
        // notAimingNode.addChild(walkNode);

        // moveSpeed == 1
        const jogNode = new AnimationBlendNode(blendTree, undefined, BlendMethods.Direct, [1], 0, this.getAnimationByName(animations, "Female.Jog"));
        notAimingNode.addChild(jogNode);

        baseLayer.stateMachine.curState = blendTree;

        /*
        // not aiming state
        const move = new ActionStateSingleAnim("idle", baseLayer.stateMachine);
        baseLayer.stateMachine.addState(move);
        move.animation = getAnimationByName(animations, "Female.Idle");
        
        const idle_aim = new ActionTransition(move);
        move.transitions.push(idle_aim);

        // aim state (a blend tree?)
        */

        const upperBodyLayer = new AnimationLayer();
        actionCtrlBehavior.animationLayers.push(upperBodyLayer);
        upperBodyLayer.name = "upperBody";
        upperBodyLayer.blendWeight = 0;

        // mask
        upperBodyLayer.mask = new AnimationMask();

        let maskRootName = "spine.001";
        let upperBodyRootJoint = actor.getChildByName(maskRootName, true);
        if (upperBodyRootJoint === null) {
            throw new Error("Mask root joint not found: " + maskRootName);
        }
        this.addJointHierarchyToLayerMask(upperBodyRootJoint, upperBodyLayer.mask);

        // for the convenience of making rig animation,
        // the parent of spine.002 is spine.IK, not spine.001. It use a copylocatoin constraint to spine.001 instead.
        // so here we need to add spine.IK and all it's children to the mask too
        maskRootName = "spine.IK";
        upperBodyRootJoint = actor.getChildByName(maskRootName, true);
        if (upperBodyRootJoint === null) {
            throw new Error("Mask root joint not found: " + maskRootName);
        }
        this.addJointHierarchyToLayerMask(upperBodyRootJoint, upperBodyLayer.mask);

        // state machine
        upperBodyLayer.stateMachine = new ActionStateMachine(actionCtrlBehavior, upperBodyLayer);

        // 2 states
        // aim state (blend tree)
        const aimBlendTree = new ActionStateBlendTree("upperAimTree", upperBodyLayer.stateMachine);
        upperBodyLayer.stateMachine.addState(aimBlendTree);

        // root node
        //      | -aim down
        //      | -aim straight
        //      | -aim up
        aimBlendTree.rootNode = new AnimationBlendNode(aimBlendTree, ["aimPitch"], BlendMethods.Simple1D, undefined, 1);

        // aimPitch == -1
        const aimDownNode = new AnimationBlendNode(aimBlendTree, undefined, BlendMethods.Direct, [-1], 0, this.getAnimationByName(animations, "Female.Aim.Down"));
        aimBlendTree.rootNode.addChild(aimDownNode);

        // aimPitch == 0
        const aimStraightNode = new AnimationBlendNode(aimBlendTree, undefined, BlendMethods.Direct, [0], 1, this.getAnimationByName(animations, "Female.Aim.Middle"));
        aimBlendTree.rootNode.addChild(aimStraightNode);

        // aimPitch == 1
        const aimUpNode = new AnimationBlendNode(aimBlendTree, undefined, BlendMethods.Direct, [1], 0, this.getAnimationByName(animations, "Female.Aim.Up"));
        aimBlendTree.rootNode.addChild(aimUpNode);

        // shoot state (blend tree)
        const shootBlendTree = new ActionStateBlendTree("upperShootTree", upperBodyLayer.stateMachine);
        upperBodyLayer.stateMachine.addState(shootBlendTree);

        // fix me: model animations not done
        // root node
        //      | -shoot down
        //      | -shoot straight
        //      | -shoot up

        shootBlendTree.rootNode = new AnimationBlendNode(shootBlendTree, ["aimPitch"], BlendMethods.Simple1D, undefined, 0);

        // aimPitch == -1
        let shootAnim = this.getAnimationByName(animations, "Female.Shoot.Down");
        shootAnim.LoopMode = AnimationLoopMode.Once;
        const shootDownNode = new AnimationBlendNode(shootBlendTree, undefined, BlendMethods.Direct, [-1], 0, shootAnim);
        shootBlendTree.rootNode.addChild(shootDownNode);

        // aimPitch == 0
        shootAnim = this.getAnimationByName(animations, "Female.Shoot.Middle");
        shootAnim.LoopMode = AnimationLoopMode.Once;
        const shootStraitNode = new AnimationBlendNode(shootBlendTree, undefined, BlendMethods.Direct, [0], 1, shootAnim);
        shootBlendTree.rootNode.addChild(shootStraitNode);

        // aimPitch == 1
        shootAnim = this.getAnimationByName(animations, "Female.Shoot.Up");
        shootAnim.LoopMode = AnimationLoopMode.Once;
        const shootUpNode = new AnimationBlendNode(shootBlendTree, undefined, BlendMethods.Direct, [1], 0, shootAnim);
        shootBlendTree.rootNode.addChild(shootUpNode);

        // the weight of this layer will be zero in other states

        // todo: state transitions and conditions
        // add a general condition class?
        // evaluate condition according to the params on actionControlBehavior?

        // aim to shoot
        // use SingleParamCondition
        const aim_shoot = new ActionTransition(aimBlendTree);
        aimBlendTree.transitions.push(aim_shoot);
        aim_shoot.targetState = shootBlendTree;
        aim_shoot.conditions.push(new SingleParamCondition(actionCtrlBehavior, "shoot", "===", 1));

        // shoot to aim (timeup?)
        const shoot_aim = new ActionTransition(shootBlendTree);
        shootBlendTree.transitions.push(shoot_aim);
        shoot_aim.targetState = aimBlendTree;
        shoot_aim.conditions.push(new TimeUpCondition(0.5));

        upperBodyLayer.stateMachine.curState = aimBlendTree;

        return actionCtrlBehavior;
    }
}
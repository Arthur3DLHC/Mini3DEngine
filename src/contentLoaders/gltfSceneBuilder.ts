import { GltfAsset, GLTF_EXTENSIONS, GLTF_ATTRIBUTES, GLTF_ELEMENTS_PER_TYPE, GLTF_COMPONENT_TYPE_ARRAYS } from "./gltfAsset.js";
import { Scene } from "../scene/scene.js";
import { GlTfId, GlTf, TextureInfo, MaterialNormalTextureInfo, Node, Animation } from "./gltf.js";
import { Object3D } from "../scene/object3D.js";
import { Mesh } from "../scene/mesh.js";
import vec3 from "../../lib/tsm/vec3.js";
import quat from "../../lib/tsm/quat.js";
import mat4 from "../../lib/tsm/mat4.js";
import { BufferGeometry } from "../geometry/bufferGeometry.js";
import { StandardPBRMaterial } from "../scene/materials/standardPBRMaterial.js";
import { Primitive } from "../geometry/primitive.js";
import vec4 from "../../lib/tsm/vec4.js";
import { RenderStateCache } from "../WebGLResources/renderStateCache.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { Texture2D } from "../WebGLResources/textures/texture2D.js";
import { SamplerState } from "../WebGLResources/renderStates/samplerState.js";
import { DefaultAttributeLocations, VertexBufferAttribute } from "../WebGLResources/vertexBufferAttribute.js";
import { VertexBuffer } from "../WebGLResources/vertexBuffer.js";
import { IndexBuffer } from "../WebGLResources/indexBuffer.js";
import { GeometryCache } from "../geometry/geometryCache.js";
import { SkinMesh } from "../scene/skinMesh.js";
import { AnimationClip } from "../animation/animationClip.js";
import { AnimationCache } from "../animation/animationCache.js";
import { KeyframeTrack } from "../animation/keyframeTrack.js";
import { AnimationChannel, AnimTargetPathDataType } from "../animation/animationChannel.js";
import { AnimationAction } from "../animation/animationAction.js";
import { AnimationSampler, Interpolation } from "../animation/animationSampler.js";
import { InstancedMesh } from "../scene/instancedMesh.js";
import { Instance } from "../scene/instance.js";
import { BaseLight } from "../scene/lights/baseLight.js";
import { KHR_Lights_Punctual } from "./gltfExtensions.js";
import { DirectionalLight } from "../scene/lights/directionalLight.js";
import { PointLight } from "../scene/lights/pointLight.js";
import { SpotLight } from "../scene/lights/spotLight.js";
import { EnvironmentProbe, EnvironmentProbeType } from "../scene/environmentProbe.js";
import { DirectionalLightShadow } from "../scene/lights/directionalLightShadow.js";
import { RigidBody } from "../physics/rigidBody.js";
import { PhysicsWorld } from "../physics/physicsWorld.js";
import { GameObjectCreator } from "./gameObjectCreator.js";

export class GLTFSceneBuilder {
    public constructor() {
        this._meshReferences = [];
        this._instancedMeshGroupCounts = [];
        this._instancedMeshGroups = [];
        this.defaultCollisionGroup = 1;
        this.defaultCollisionMask = 254;    // 11111110  don't collide with self?
    }

    // todo: extension parser?
    // todo: custom extra parser?

    private _meshReferences: number[];

    /**
     * key: instanceGroupId; value: instance count in that group
     */
    private _instancedMeshGroupCounts: Map<number, number>[];

    /**
     * array of instance groups
     * instanced meshes should be grouped by occlusion group ID.
     * key: instanceGroupId; value: instancedMesh or a node with instanceMeshes as children 
     */
    private _instancedMeshGroups: Map<number, Object3D>[];

    private static _gltfToBufferAttrNames: Map<string, string> = new Map([
        [GLTF_ATTRIBUTES.POSITION, VertexBufferAttribute.defaultNamePosition],
        [GLTF_ATTRIBUTES.NORMAL, VertexBufferAttribute.defaultNameNormal],
        [GLTF_ATTRIBUTES.TANGENT, VertexBufferAttribute.defaultNameTangent],
        [GLTF_ATTRIBUTES.TEXCOORD_0, VertexBufferAttribute.defaultNameTexcoord0],
        [GLTF_ATTRIBUTES.TEXCOORD_1, VertexBufferAttribute.defaultNameTexcoord1],
        [GLTF_ATTRIBUTES.COLOR_0, VertexBufferAttribute.defaultNameColor0],
        [GLTF_ATTRIBUTES.JOINTS_0, VertexBufferAttribute.defaultNameJoints0],
        [GLTF_ATTRIBUTES.WEIGHTS_0, VertexBufferAttribute.defaultNameWeights0],
    ]);
    
    /**
     * set lights as static
     */
    public setLightsStatic: boolean = true;

    /**
     * can multiply intensity of lights by a global rate when building level
     * to overcome the problem of differences in lighting calculation between engine and blender.
     */
    public lightIntensityRate: number = 1;

    // fix me: hold ref to scene here?

    /** if not null, the collider rigid bodies will be created and added to this world */
    public physicsWorld: PhysicsWorld | null = null;

    /** the default physics material of colliders in gltf */
    public defaultPhysicsMaterial: CANNON.Material | null = null;

    public physicsMaterials: Map<string, CANNON.Material> | null = null;

    /** defualt collision group of static objects in level. = 1 */
    public defaultCollisionGroup: number | undefined;
    /** default collision mask of static objects in level. = 11111110b. they do not collide with each other. */
    public defaultCollisionMask: number | undefined;

    public processConstraints: null | ((node: Object3D, nodeDef: Node) => void) = null;

    public gameObjectCreator: GameObjectCreator | null = null;

    // public processPrefab: ((nodeDef: Node) => Object3D) | null = null;

    /**
     * build scene hierarchy from gltf asset. NOTE: don't call this before all binary datas has been loaded.
     * @param gltf the GlTf asset data
     * @param sceneIdx index of scene in gltf
     * @param animations an array to receive animaitons loaded from gltf, is presidented
     * @param instancing use instanced mesh for meshes shared by multiple nodes in gltf. this is usually for optimizing display of large level scenes
     */
    public build(gltf: GltfAsset, sceneIdx: number, animations?: AnimationAction[], instancing: boolean = false): Object3D {

        // gltf 中 scene.nodes[] 中的节点都只能是根节点
        // get gltf scene object
        if (gltf.gltf.scenes === undefined || gltf.gltf.nodes === undefined) {
            throw new Error("No scenes in glTF file.");
        }
        const sceneDef = gltf.gltf.scenes[sceneIdx];
        if (sceneDef.nodes === undefined) {
            throw new Error("No root nodes in scene.");
        }

        // iterate through all root nodes
        const scene = new Object3D();

        // clear mesh reference numbers every time.
        this._meshReferences = [];
        if (gltf.gltf.meshes !== undefined) {
            for (let i = 0; i < gltf.gltf.meshes.length; i++) {
                this._meshReferences.push(0);
            }   
        }

        this._instancedMeshGroupCounts = [];
        this._instancedMeshGroups = [];

        if (instancing) {
            // sum mesh reference count; split by instancing groups?
            // if is skinned mesh, do not use instancing;
            this.gatherInstances(gltf.gltf.nodes);
        }

        // set a temp node array first
        const nodes: Object3D[] = [];

        for (const nodeDef of gltf.gltf.nodes) {
            const node = this.processNode(nodeDef, gltf, instancing);
            // if is gameobject, will be null
            // if(node !== null)
            // keep the index right
            nodes.push(node);
        }

        // sceneDef.nodes is array of root node indices in the scene
        for (const nodeID of sceneDef.nodes) {
            // this.processNode(nodeID, scene, gltf);
            this.createNodeHierarchy(nodeID, scene, nodes, gltf);
        }

        if (instancing) {
            for (const grp of this._instancedMeshGroups) {
                if(grp !== undefined) {
                    grp.forEach((instMesh, key, map)=>{
                        scene.attachChild(instMesh);
                        console.log("add instance mesh to scene: " + instMesh.name);
                    })
                }
            }
        }

        // todo: process skin meshes; findout skelecton joints
        let iNode = 0;
        for (const nodeDef of gltf.gltf.nodes) {
            if (nodeDef.skin !== undefined) {
                this.processSkin(nodes[iNode], nodeDef.skin, nodes, gltf);
            }
            iNode++;
        }

        if (animations !== undefined && gltf.gltf.animations !== undefined) {
            // try to read animations
            animations.length = 0;
            let ianim = 0;
            for (const animDef of gltf.gltf.animations) {
                animations.push(this.processAnimation(ianim++, animDef, nodes, gltf));
            }
        }

        return scene;
    }

    private gatherInstances(nodes: Node[]) {
        
        for (const nodeDef of nodes) {
            if (nodeDef.mesh !== undefined) {
                if (this._meshReferences[nodeDef.mesh] > 0) { // is an instanced mesh
                    if (this._instancedMeshGroups[nodeDef.mesh] === undefined) {
                        this._instancedMeshGroups[nodeDef.mesh] = new Map<number, Object3D>();
                    }

                    // get or add the instance groups of this mesh
                    let instGroupCount = this._instancedMeshGroupCounts[nodeDef.mesh];
                    if (instGroupCount === undefined) {
                        instGroupCount = new Map<number, number>();
                        this._instancedMeshGroupCounts[nodeDef.mesh] = instGroupCount;
                    }

                    // fetch instance group id from gltf, or use default
                    let instGroupId: number = 0;
                    if (nodeDef.extras !== undefined) {
                        if (nodeDef.extras.instanceGroup !== undefined) {
                            instGroupId = nodeDef.extras.instanceGroup;
                        }
                    }

                    // get or increase the instance count of the node's group
                    let instCount = instGroupCount.get(instGroupId);
                    if (instCount === undefined) {
                        instCount = 2;
                        instGroupCount.set(instGroupId, instCount);
                    } else {
                        instGroupCount.set(instGroupId, instCount + 1);
                    }
                }
                this._meshReferences[nodeDef.mesh]++;
            }
        }
    }

    private createNodeHierarchy(nodeId: GlTfId, parentObject: Object3D, nodes: Object3D[], gltf: GltfAsset) {
        if (gltf.gltf.nodes === undefined) {
            throw new Error("Nodes not found");
        }
        const nodeDef = gltf.gltf.nodes[nodeId];
        const node = nodes[nodeId];

        // skip gameobjects
        if (nodeDef.extras !== undefined) {
            if (nodeDef.extras.extType == "gameObject") {
                return;
            }
        }

        parentObject.attachChild(node);

        if (nodeDef.children !== undefined) {
            for (const childId of nodeDef.children) {
                this.createNodeHierarchy(childId, node, nodes, gltf);
            }
        }
    }
    
    /**
     * 
     * @param nodeDef 
     * @param gltf 
     * @param instancing
     * @returns Object3D created accroding to nodeDef, or null if nodeDef is a GameObject (will be add to scene, not level) 
     */
    private processNode(nodeDef: Node, gltf: GltfAsset, instancing: boolean): Object3D {

        let node: Object3D;
        let isGameObject: boolean = false;
        if (nodeDef.mesh !== undefined) {
            if (this._meshReferences[nodeDef.mesh] > 1) {
                // todo: handle instancing; create a new instance referencing same geometry;
                // and render mesh using instancing mode
                if (instancing && nodeDef.skin === undefined) {
                    // instanced mesh groups. should be generated before
                    node = this.processInstance(nodeDef, gltf);
                } else {
                    // just create a new mesh; it will share same cached geometry with other nodes
                    node = this.processMesh(nodeDef.mesh, nodeDef.skin !== undefined, gltf);
                }
            } else {
                node = this.processMesh(nodeDef.mesh, nodeDef.skin !== undefined, gltf);
            }
            // this._meshReferences[nodeDef.mesh]++;

            // occlusion query? only meshes
            if (nodeDef.extras !== undefined && nodeDef.extras.occlusionQuery !== undefined) {
                node.occlusionQuery = (nodeDef.extras.occlusionQuery === 1);        // blender custom prop boolean is number 0 or 1
            }

            // drop shadow? only meshes
            // blender does not have per object shadow control now
        }
        else {
            // todo: light, environment probe, irradiance volume
            if (nodeDef.extensions !== undefined) {
                if (nodeDef.extensions.KHR_lights_punctual !== undefined) {
                    node = this.processLight(nodeDef, gltf);
                } else {
                    node = new Object3D();
                }
            } else if (nodeDef.extras !== undefined) {
                // if not light but has extra custum properties
                if (nodeDef.extras.extType === "irradianceVolume") {
                    node = this.processIrradianceVolume(nodeDef, gltf);
                } else if (nodeDef.extras.extType === "environmentProbe") {
                    node = this.processEnvironmentProbe(nodeDef, gltf);
                } else if (this.isPhysicsCollider(nodeDef)) {
                    node = this.processCollider(nodeDef, gltf);
                } else if (nodeDef.extras.extType == "gameObject" && this.gameObjectCreator !== null) {
                    // todo: object prefab key?
                    // define components in prefab json file,
                    // then add the prefab key as object custrom property in blender
                    // can only set no mesh node as gameobject?
                    let position: vec3 = new vec3();
                    let rotation: quat = quat.identity.copyTo();
                    let scale: vec3 = new vec3([1,1,1]);
                    if (nodeDef.translation !== undefined) {
                        position.setComponents(nodeDef.translation[0], nodeDef.translation[1], nodeDef.translation[2]);
                    }
                    if (nodeDef.rotation !== undefined) {
                        rotation.setComponents(nodeDef.rotation[0], nodeDef.rotation[1], nodeDef.rotation[2], nodeDef.rotation[3]);
                    }
                    if (nodeDef.scale !== undefined) {
                        scale.setComponents(nodeDef.scale[0], nodeDef.scale[1], nodeDef.scale[2]);
                    }

                    isGameObject = true;
                    node = this.gameObjectCreator.createGameObject(nodeDef.name || "", nodeDef.extras.prefabKey, nodeDef.extras, position, rotation, scale);
                } else {
                    // todo: other extra object types
                    node = new Object3D();
                }
            }
            else {
                node = new Object3D();
            }
        }

        // todo: if node extras has constraints, parse it?
        // a mesh node can also have constraint?
        // a node can have multiple constraints?
        if (nodeDef.extras !== undefined) {
            // if (nodeDef.extras.constraints > 0 && this.processConstraints !== null) {
             if (this.processConstraints !== null) {
                this.processConstraints(node, nodeDef);
            }
        }

        node.name = nodeDef.name !== undefined ? nodeDef.name : "";

        // parentObject.attachChild(node);

        this.processNodeTransform(nodeDef, node);

        // if(isGameObject) return null;
        return node;

        //if (nodeDef.children !== undefined) {
        //    for (const childId of nodeDef.children) {
        //        this.processNode(childId, node, gltf);
        //    }
        //}
    }

    private isPhysicsCollider(nodeDef: Node): boolean {
        if (nodeDef.extras !== undefined) {
            return nodeDef.extras.extType === "collider";
        }
        return false;
    }

    /**
     * process physics colliders
     * fix me: now use the local SRT, so the colliders can't have hierarchical structure
     * is it better to extract SRT from global transform matrix?
     * @param nodeDef 
     * @param gltf 
     */
    private processCollider(nodeDef: Node, gltf: GltfAsset): Object3D {
        // nodeDef may not have S, R or T if they are default
        let scale: number[] = [1, 1, 1];
        if (nodeDef.scale !== undefined) {
            scale = nodeDef.scale;
        }

        const node = new Object3D();
        if (this.physicsWorld !== null && this.defaultPhysicsMaterial !== null) {
            let physicsMaterial: CANNON.Material = this.defaultPhysicsMaterial;
            // object has material properties presented?

            if (nodeDef.extras.physicsMtl !== undefined) {
                if (this.physicsMaterials !== null) {
                    let foundMtl = this.physicsMaterials.get(nodeDef.extras.physicsMtl);
                    if (foundMtl !== undefined) {
                        physicsMaterial = foundMtl;
                    } else {
                        console.warn("physics material not found: " + nodeDef.extras.physicsMtl);
                    }
                } else {
                    console.warn("node has physics material name but builder do not has material map");
                }
            }

            // let friction: number = this.defaultPhysicsMaterial.friction;
            // let restitution: number = this.defaultPhysicsMaterial.restitution;

            // if (nodeDef.extras.friction !== undefined) friction = nodeDef.extras.friction;
            // if (nodeDef.extras.restitution !== undefined) restitution = nodeDef.extras.restitution;

            // if (friction !== this.defaultPhysicsMaterial.friction || restitution !== this.defaultPhysicsMaterial.restitution) {
            //     let cachedMtl = this._physicsMaterialCache.find((mtl)=>{return mtl.friction === friction && mtl.restitution === restitution;});
            //     if (cachedMtl === undefined) {
            //         cachedMtl = new CANNON.Material({});
            //     }
            // }
            
            let shape: string = "unkown";    // cannon.box
            if (nodeDef.extras.colliderShape !== undefined) {
                shape = nodeDef.extras.colliderShape;
            }
            let body: RigidBody | null = null;
            switch (shape) {
                case "box":
                    body = new RigidBody(node, this.physicsWorld, {mass: 0, material: physicsMaterial});
                    // the param is half extends, == the scale in blender
                    const boxShape = new CANNON.Box(new CANNON.Vec3(scale[0], scale[1], scale[2]));
                    body.body.addShape(boxShape);
                    break;
                case "sphere":
                    body = new RigidBody(node, this.physicsWorld, {mass: 0, material: physicsMaterial});
                    const sphereShape = new CANNON.Sphere(scale[0]);
                    body.body.addShape(sphereShape);
                    break;
                case "cylinder":
                    body = new RigidBody(node, this.physicsWorld, {mass: 0, material: physicsMaterial});
                    const cylinderShape = new CANNON.Cylinder(scale[0], scale[0], scale[1] * 2, 16);
                    // the cylinder in cannon.js is horizontal, but in blender is vertical
                    // according to the project owner, we could use transformAllPoints() to rotate it.
                    // https://github.com/schteppe/cannon.js/issues/58
                    const axisAlignQuat = new CANNON.Quaternion();
                    axisAlignQuat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI * 0.5);
                    const axisAlignTrans = new CANNON.Vec3(0, 0, 0);
                    cylinderShape.transformAllPoints(axisAlignTrans, axisAlignQuat);
                    body.body.addShape(cylinderShape);
                    break;
                default:
                    // report the colliders without a shape?
                    throw new Error("collider does not have shape:" + nodeDef.name || "unnamed_collider");
                    break;
            }
            if (body !== null) {
                if (nodeDef.extras.collisionGroup !== undefined) {
                    body.body.collisionFilterGroup = nodeDef.extras.collisionGroup;
                } else {
                    if (this.defaultCollisionGroup !== undefined) {
                        body.body.collisionFilterGroup = this.defaultCollisionGroup;
                    }
                }
                if (nodeDef.extras.collisionMask !== undefined) {
                    body.body.collisionFilterMask = nodeDef.extras.collisionMask
                } else {
                    if (this.defaultCollisionMask !== undefined) {
                        body.body.collisionFilterMask = this.defaultCollisionMask;  // 11111110 don't collide with self?
                    }
                }

                this.physicsWorld.world.addBody(body.body);
                node.behaviors.push(body);

                if (nodeDef.translation !== undefined) {
                    body.setPosition(new vec3([nodeDef.translation[0], nodeDef.translation[1], nodeDef.translation[2]]));
                }
                if (nodeDef.rotation !== undefined) {
                    body.setRotation(new quat([nodeDef.rotation[0], nodeDef.rotation[1], nodeDef.rotation[2], nodeDef.rotation[3]]));
                }
            }
        }
        
        return node;
    }

    private processEnvironmentProbe(nodeDef: Node, gltf: GltfAsset): Object3D {
        // return single envprobe
        if (nodeDef.extras === undefined) {
            throw new Error("No extras on node.");
        }

        const extras = nodeDef.extras;

        const envProbe = new EnvironmentProbe();
        envProbe.probeType = EnvironmentProbeType.Reflection;
        if (extras.clippingStart !== undefined) envProbe.clippingStart = extras.clippingStart;
        if (extras.clippingEnd !== undefined) envProbe.clippingEnd = extras.clippingEnd;
        if (extras.visibleRange !== undefined) envProbe.visibleDistance = extras.visibleRange;
        if (extras.influenceDist !== undefined) envProbe.localRange.xyz = [extras.influenceDist, extras.influenceDist, extras.influenceDist];
        return envProbe;
    }

    private processIrradianceVolume(nodeDef: Node, gltf: GltfAsset): Object3D {
        // todo: calc environtment probe locations, 
        if (nodeDef.extras === undefined) {
            throw new Error("No extras on node.");
        }

        const extras = nodeDef.extras;
        let resX = 1, resY = 1, resZ = 1;
        if (extras.resolutionX !== undefined) resX = extras.resolutionX;
        if (extras.resolutionY !== undefined) resY = extras.resolutionY;
        if (extras.resolutionZ !== undefined) resZ = extras.resolutionZ;

        let ret: Object3D;

        if(resX === 1 && resY === 1 && resZ === 1) {
            // if resolution is 1x1x1, return one envprobe object
            const envProbe = new EnvironmentProbe();
            envProbe.isStatic = true;
            envProbe.probeType = EnvironmentProbeType.Irradiance;
            envProbe.autoUpdateTransform = false;
            // envProbe.localRange = 1.0;
            if (extras.clippingStart !== undefined) envProbe.clippingStart = extras.clippingStart;
            if (extras.clippingEnd !== undefined) envProbe.clippingEnd = extras.clippingEnd;
            if (extras.influenceDist !== undefined) envProbe.localRange.xyz = [extras.influenceDist, extras.influenceDist, extras.influenceDist];
            ret = envProbe;
        } else {
            // else add envprobes as children
            ret = new Object3D();
            // put the envprobe on the center of every cell
            // irradiane volume radius is 1 in blender, so the box size is 2?
            const cellSize = new vec3([1.0 / resX, 1.0 / resY, 1.0 / resZ]);
            const halfCellSize = cellSize.copyTo();
            halfCellSize.scale(0.5);
            for (let k = 0; k < resZ; k++) {
                for (let j = 0; j < resY; j++) {
                    for (let i = 0; i < resX; i++) {
                        const envProbe = new EnvironmentProbe();
                        envProbe.isStatic = true;
                        envProbe.probeType = EnvironmentProbeType.Irradiance;
                        envProbe.autoUpdateTransform = false;
                        if (extras.clippingStart !== undefined) envProbe.clippingStart = extras.clippingStart;
                        if (extras.clippingEnd !== undefined) envProbe.clippingEnd = extras.clippingEnd;
                        // if (extras.influenceDist !== undefined) {
                        //    envProbe.localRange.xyz = [extras.influenceDist, extras.influenceDist, extras.influenceDist];
                        //} else {
                            cellSize.copyTo(envProbe.localRange);
                            envProbe.localRange.scale(2);   // default irradiance volume size is 2 in blender
                        //}

                        envProbe.translation.x = i / (resX) + halfCellSize.x;
                        envProbe.translation.y = j / (resY) + halfCellSize.y;
                        envProbe.translation.z = k / (resZ) + halfCellSize.z;

                        // in blender, the irradiance volume unit range is [-1, 1]
                        envProbe.translation.x = envProbe.translation.x * 2.0 - 1.0;
                        envProbe.translation.y = envProbe.translation.y * 2.0 - 1.0;
                        envProbe.translation.z = envProbe.translation.z * 2.0 - 1.0;

                        // fix me: how to set the affect radius of envprobe?
                        envProbe.updateLocalTransform(true, false);
                        ret.attachChild(envProbe);
                    }
                }
            }
        }

        return ret;
    }

    private processLight(nodeDef: Node, gltf: GltfAsset): BaseLight {
        const extensions = gltf.gltf.extensions;
        if (extensions === undefined) {
            throw new Error("No extensions in gltf");
        }
        const punctualLights: KHR_Lights_Punctual = extensions.KHR_lights_punctual;
        if (punctualLights === undefined) {
            throw new Error("No lights found in extensions");
        }
        const lightDefs = punctualLights.lights;
        if (nodeDef.extensions === undefined || nodeDef.extensions.KHR_lights_punctual === undefined) {
            throw new Error("No light extension on node");
        }
        const lightIdx: number = nodeDef.extensions.KHR_lights_punctual.light;
        const lightDef = lightDefs[lightIdx];
        if (lightDef === undefined) {
            throw new Error("Light not found in lights array");
        }
        let intensity = 1;
        if (lightDef.intensity !== undefined) intensity = lightDef.intensity;
        intensity *= this.lightIntensityRate;
        let light: BaseLight;
        switch(lightDef.type) {
            case "directional":
                const dirLight = new DirectionalLight();
                light = dirLight;
                // directional lights in blender do not have range
                // so define it in extras
                if (lightDef.extras !== undefined) {
                    if (lightDef.extras.radius !== undefined) dirLight.radius = lightDef.extras.radius;
                    if (lightDef.extras.shadowDistance !== undefined) {
                        dirLight.range = lightDef.extras.shadowDistance;
                        const dirShadow = dirLight.shadow as DirectionalLightShadow;
                        dirShadow.range = lightDef.extras.shadowDistance;
                    }
                }
                break;
            case "point":
                const pointLight = new PointLight();
                light = pointLight;
                // todo: range
                if(lightDef.range !== undefined) {
                    pointLight.range = lightDef.range;
                } else {
                    pointLight.range = intensity * 0.2;
                }
                break;
            case "spot":
                const spotLight = new SpotLight();
                light = spotLight;
                // range
                if(lightDef.range !== undefined) {
                    spotLight.range = lightDef.range;
                } else {
                    spotLight.range = intensity * 0.2;
                }
                // cone angles
                if(lightDef.spot !== undefined) {
                    if(lightDef.spot.outerConeAngle !== undefined) spotLight.outerConeAngle = lightDef.spot.outerConeAngle;
                    if(lightDef.spot.innerConeAngle !== undefined) spotLight.innerConeAngle = lightDef.spot.innerConeAngle; 
                }
                break;
            default:
                throw new Error("Unknown light type:" + lightDef.type);
        }
        if (lightDef.name !== undefined) light.name = lightDef.name;
        if (lightDef.color !== undefined) light.color.xyzw = [lightDef.color[0], lightDef.color[1], lightDef.color[2], 1];
        // if (lightDef.intensity !== undefined) light.intensity = intensity;
        light.intensity = intensity;
        light.isStatic = this.setLightsStatic;
        // todo: cast shadows ? set in custom properties extras?
        // the shadow properties will be copied from light objects to their custom properties block in Blender by python script.
        if (lightDef.extras !== undefined) {
            const extras = lightDef.extras;
            // light.castShadow = extras.castShadow !== undefined ? extras.castShadow : false;
            light.castShadow = (extras.castShadow === 1);
            if (light.shadow !== null) {
                if (extras.shadowMapSize !== undefined) {
                     light.shadow.mapSize.x = extras.shadowMapSize;
                     light.shadow.mapSize.y = extras.shadowMapSize;
                }
                if (extras.shadowBias !== undefined) {
                    light.shadow.bias = extras.shadowBias;
                }
            }
        }
        return light;
    }

    private processNodeTransform(nodeDef: Node, node: Object3D) {
        if (nodeDef.matrix !== undefined) {
            node.localTransform.init(nodeDef.matrix);
            // todo: decompose matrix ?
            node.localTransform.getScaling(node.scale);
            node.localTransform.getRotation(node.rotation);
            node.localTransform.getTranslation(node.translation);
        }
        else {
            if (nodeDef.translation !== undefined) {
                node.translation = new vec3([nodeDef.translation[0], nodeDef.translation[1], nodeDef.translation[2]]);
            }

            if (nodeDef.rotation !== undefined) {
                node.rotation = new quat([nodeDef.rotation[0], nodeDef.rotation[1], nodeDef.rotation[2], nodeDef.rotation[3]]);
            }

            if (nodeDef.scale !== undefined) {
                // if is a physics collider, the scale should be ignored?
                if (!this.isPhysicsCollider(nodeDef)) {
                    node.scale = new vec3([nodeDef.scale[0], nodeDef.scale[1], nodeDef.scale[2]]);
                }
            }

            node.updateLocalTransform(true, false);
        }
    }

    private processInstance(nodeDef: Node, gltf: GltfAsset): Object3D {
        if (nodeDef.mesh === undefined) {
            throw new Error("Node does not have mesh index");
        }
        let node: Object3D;
        let instGroup = this._instancedMeshGroups[nodeDef.mesh];
        if (instGroup === undefined) {
            throw new Error("Instance group not found: " + nodeDef.mesh);
        }

        let instCounts = this._instancedMeshGroupCounts[nodeDef.mesh];
        if (instCounts === undefined) {
            throw new Error("Instance group not found: " + nodeDef.mesh);
        }

        // retrive the group id of node
        let instGroupId: number = 0;
        if (nodeDef.extras !== undefined) {
            if (nodeDef.extras.instanceGroup !== undefined) {
                instGroupId = nodeDef.extras.instanceGroup;
            }
        }

        let count = instCounts.get(instGroupId);

        // instanced mesh with groupid
        // maybe a instanced mesh array
        let instMesh = instGroup.get(instGroupId);
        if (instMesh === undefined) {
            instMesh = this.processMesh(nodeDef.mesh, nodeDef.skin !== undefined, gltf, count);
            instGroup.set(instGroupId, instMesh);
            if (nodeDef.name !== undefined) {
                instMesh.name = "instmesh_" + nodeDef.name;
            }

            if (nodeDef.extras !== undefined && nodeDef.extras.occlusionQuery !== undefined) {
                instMesh.occlusionQuery = nodeDef.extras.occlusionQuery;
            }

            console.info("Instanced mesh: " + nodeDef.mesh);
        }

        // add this node to instance matrix of instanced mesh
        if (instMesh instanceof InstancedMesh) {
            const m = instMesh as InstancedMesh;
            // create an instance node? is that necessary?
            node = new Instance(m, m.curInstanceCount);
            this.processNodeTransform(nodeDef, node);
            m.curInstanceCount++;
        }
        else {
            node = new Object3D();
            this.processNodeTransform(nodeDef, node);
            // iterate all child meshes, add correspounding child instance nodes
            for (const child of instMesh.children) {
                if (child instanceof InstancedMesh) {
                    const m = child as InstancedMesh;
                    // create an instance node? is that necessary?
                    const childNode = new Instance(m, m.curInstanceCount);
                    node.attachChild(childNode);
                    m.curInstanceCount++;
                }
            }
        }
        console.info("Instance of instanced mesh: " + nodeDef.mesh);
        return node;
    }

    private processSkin(node: Object3D, skinIdx: number, nodes: Object3D[], gltf: GltfAsset) {
        if (node instanceof SkinMesh) {
            this.addSkinInfo(node, skinIdx, nodes, gltf);
        } else {
            // an mesh group?
            for (const child of node.children) {
                if (child instanceof SkinMesh) {
                    this.addSkinInfo(child, skinIdx, nodes, gltf);
                }
            }
        }
    }

    private addSkinInfo(mesh: SkinMesh, skinIdx: number, nodes: Object3D[], gltf: GltfAsset) {
        if (gltf.gltf.skins === undefined) {
            throw new Error("Skin data not found.");
        }
        const skinDef = gltf.gltf.skins[skinIdx];
        
        // load bind pose matrices
        // stored in accessor data in gltf
        // need to copy to an float32array?
        if (skinDef.inverseBindMatrices !== undefined ) {
            const data = gltf.accessorDataSync(skinDef.inverseBindMatrices);
            const floatArray: Float32Array = new Float32Array(data.buffer, data.byteOffset, data.length / 4);
            // copy float elems to mat4
            const numMatrices = floatArray.length / 16;
            if( numMatrices !== skinDef.joints.length) {
                throw new Error("Joints count and bind matrices count mismatch");
            }
            for (let i = 0; i < numMatrices; i++) {
                const elemArray = floatArray.subarray(i * 16, i * 16 + 16);
                const values: number[] = [];
                for(let e = 0; e < 16; e++) values[e] = elemArray[e];
                const matrix = new mat4(values);
                mesh.inverseBindMatrices.push(matrix);
                mesh.jointMatrices.push(mat4.identity.copyTo());
            }
        } else {
            console.warn("No inverseBindMatrices in gltf file");
        }

        // find joint nodes?
        for (const jointIdx of skinDef.joints) {
            // my not have animation
            // nodes[jointIdx].autoUpdateTransform = true;
            mesh.joints.push(nodes[jointIdx]);
        }

        // whether need to ref to the root node of skeleton?
        // skinDef.skeleton;
    }

    /**
     * 
     * @param meshId 
     * @param gltf 
     * @returns if mesh only has 1 primitive, return a mesh object; or return an object3d node with multiple mesh children.
     */
    private processMesh(meshId: GlTfId, isSkin: boolean, gltf: GltfAsset, numInstances: number = 1): Object3D {
        if (gltf.gltf.meshes === undefined
            || gltf.gltf.accessors === undefined
            || gltf.gltf.bufferViews === undefined
            || gltf.gltf.buffers === undefined) {
            throw new Error("No meshes, accessors or bufferviews in gltf.");
        }
        // what if no materials in gltf?
        // use a default mtl? or ignore mtls?
        const meshDef = gltf.gltf.meshes[meshId];
        if (meshDef === undefined) {
            throw new Error("Mesh not found in meshes array");
        }
        
        // the sub primitives in gltf is separated.
        // need to use multiple meshes
        const meshes: Mesh[] = [];

        let iprim: number = 0;
        for (const primDef of meshDef.primitives) {
            // geometry
            // todo: use a global geometry cache, to share between all objects created from this gltf file.
            // key: gltffileurl.meshid.primid?
            const geometryKey: string = gltf.uri + ".mesh" + meshId.toString() + ".prim" + iprim.toString();

            let geometry: BufferGeometry;
            let cached = GeometryCache.instance.get(geometryKey);
            if (cached !== undefined) {
                geometry = cached;
            } else {
                geometry = new BufferGeometry();
                GeometryCache.instance.add(geometryKey, geometry);
                geometry.inCache = true;
                
                // use bufferview index?
                // todo: use a whole gltf file domain vertex buffer map?
                const vertexBuffers: Map<string, VertexBuffer> = new Map<string, VertexBuffer>();
                const vertexAttributes: VertexBufferAttribute[] = [];

                if (primDef.extensions && primDef.extensions[GLTF_EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]) {
                    // todo: DRACO compression
                } else {
                    // todo: attributes, vertexbuffer, indexbuffer
                    const attributes = primDef.attributes;
                    for (const attr in attributes) {
                        // todo: from glTF attribute name to our attribute name
                        // attr is key string
                        const attrname = this.attributeNameFromGLTF(attr);

                        const accessorId = attributes[attr];
                        const accessor = gltf.gltf.accessors[accessorId];

                        // form Three.js:
                        // Ignore empty accessors, which may be used to declare runtime
                        // information about attributes coming from another source (e.g. Draco
                        // compression extension).
                        if (accessor.bufferView === undefined) {
                            continue;
                        }

                        const accessorData = gltf.accessorDataSync(accessorId);

                        // according to the gltf specification, the vertex buffer should corresbounding to the gltf bufferview?
                        // one vertex buffer for one bufferview?
                        const bufferViewIdx: number = accessor.bufferView;
                        const bufferView = gltf.gltf.bufferViews[bufferViewIdx];

                        // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
                        const itemSize = GLTF_ELEMENTS_PER_TYPE[accessor.type];
                        const typedArray = GLTF_COMPONENT_TYPE_ARRAYS[accessor.componentType];

                        const elementBytes = typedArray.BYTES_PER_ELEMENT;
                        const itemBytes = itemSize * elementBytes;
                        const byteOffset = accessor.byteOffset || 0;
                        const byteStride = accessor.bufferView !== undefined ? gltf.gltf.bufferViews[accessor.bufferView].byteStride : undefined;
                        const normalize: boolean = accessor.normalized === true;

                        const vbKey: string = bufferViewIdx.toString();
                        let vb = vertexBuffers.get(vbKey);
                        if (vb === undefined) {
                            vb = new VertexBuffer(GLDevice.gl.STATIC_DRAW);

                            vb.data = accessorData;
                            if (bufferView.byteStride) {
                                // according to glTF specification,
                                // byteStride must be defined, when two or more accessors use the same bufferView.
                                vb.stride = bufferView.byteStride;
                            } else {
                                // suppose there is only 1 accessor use this bufferView.
                                vb.stride = itemBytes;
                            }
                            vb.create();

                            vertexBuffers.set(vbKey, vb);
                        }

                        const vbAttr = new VertexBufferAttribute(attrname, DefaultAttributeLocations[attrname], vb, itemSize, accessor.componentType, byteOffset);
                        vertexAttributes.push(vbAttr);
                    }
                }

                for (const vertexBuffer of vertexBuffers.values()) {
                    geometry.vertexBuffers.push(vertexBuffer);
                }

                for (const vertexAttribute of vertexAttributes) {
                    geometry.attributes.push(vertexAttribute);
                }

                // indices
                if (primDef.indices !== undefined) {
                    const accessorData = gltf.accessorDataSync(primDef.indices);
                    const accessor = gltf.gltf.accessors[primDef.indices];
                    geometry.indexBuffer = new IndexBuffer(GLDevice.gl.STATIC_DRAW);
                    geometry.indexBuffer.indices = accessorData;
                    geometry.indexBuffer.componentType = accessor.componentType;
                    geometry.indexBuffer.count = accessor.count;
                    geometry.indexBuffer.create();
                }

                geometry.drawMode = (primDef.mode === undefined ? GLDevice.gl.TRIANGLES : primDef.mode);

                // in gltf, one primitive only has one material
                const prim = new Primitive(0, Infinity, 0);
                geometry.primitives.push(prim);

                geometry.computeBounding();
                geometry.prepareVertexBufferArray();
            }

            iprim++;

            let mesh: Mesh;

            if (numInstances > 1) {
                mesh = new InstancedMesh(numInstances, false, 0, true);
            } else {
                mesh = new Mesh;
            }

            // todo: primitive draw mode
            if (primDef.mode === GLDevice.gl.TRIANGLES
                || primDef.mode === GLDevice.gl.TRIANGLE_FAN
                || primDef.mode === GLDevice.gl.TRIANGLE_STRIP
                || primDef.mode === undefined) {
                // todo: is this a skin mesh?
                if (isSkin) {
                    mesh = new SkinMesh();
                }
            } else if (primDef.mode === GLDevice.gl.LINES
                || primDef.mode === GLDevice.gl.LINE_STRIP
                || primDef.mode === GLDevice.gl.LINE_LOOP) {
                // mesh = new Mesh();
                
            } else if (primDef.mode === GLDevice.gl.POINTS) {
                // mesh = new Mesh();
            }

            mesh.geometry = geometry;

            // material
            if(primDef.material !== undefined) {
                mesh.materials.push(this.processMaterial(primDef.material, gltf));
            } else {
                // add a default material?
                const defaultMtl = new StandardPBRMaterial();
                mesh.materials.push(defaultMtl);
            }

            meshes.push(mesh);
        }

        // todo: if mesh has skin info
        if (meshes.length === 1) {
            return meshes[0];
        }

        const meshlist = new Object3D();
        for (const mesh of meshes) {
            meshlist.attachChild(mesh);
        }
        return meshlist;
    }

    attributeNameFromGLTF(gltfAttr: string): string {
        const bufferAttr = GLTFSceneBuilder._gltfToBufferAttrNames.get(gltfAttr);
        if (bufferAttr !== undefined) {
            return bufferAttr;
        }

        throw new Error("Unknown attribute:" + gltfAttr);

        // switch (gltfAttr) {
        //     case GLTF_ATTRIBUTES.POSITION:
        //         return VertexBufferAttribute.defaultNamePosition;
        //         break;
        //     case GLTF_ATTRIBUTES.NORMAL:
        //         return VertexBufferAttribute.defaultNameNormal;
        //         break;
        //     case GLTF_ATTRIBUTES.TANGENT:
        //         return VertexBufferAttribute.defaultNameTangent;
        //         break;
        //     case GLTF_ATTRIBUTES.TEXCOORD_0:
        //         return VertexBufferAttribute.defaultNameTexcoord0;
        //         break;
        //     case GLTF_ATTRIBUTES.TEXCOORD_1:
        //         return VertexBufferAttribute.defaultNameTexcoord1;
        //         break;
        //     case GLTF_ATTRIBUTES.COLOR_0:
        //         return VertexBufferAttribute.defaultNameColor0;
        //         break;
        //     case GLTF_ATTRIBUTES.JOINTS_0:
        //         return VertexBufferAttribute.defaultNameJoints0;
        //         break;
        //     case GLTF_ATTRIBUTES.WEIGHTS_0:
        //         return VertexBufferAttribute.defaultNameWeights0;
        //         break;

        //     default:
        //         throw new Error("Unknown attribute:" + gltfAttr);
        //         break;
        // }
    }

    private processMaterial(mtlId: GlTfId, gltf: GltfAsset): StandardPBRMaterial {
        const mtl = new StandardPBRMaterial();
        if (gltf.gltf.materials !== undefined) {
            const mtlDef = gltf.gltf.materials[mtlId];
            mtl.name = mtlDef.name || "unnamed";

            // todo: alpha blend mode, alpha clip, double sided?
            if (mtlDef.alphaMode !== undefined) {
                switch(mtlDef.alphaMode) {
                    case "OPAQUE":
                        mtl.blendState = RenderStateCache.instance.getBlendState(false);
                        mtl.depthStencilState = RenderStateCache.instance.getDepthStencilState(true, true, GLDevice.gl.LEQUAL);
                        break;
                    case "MASK":
                        mtl.blendState = RenderStateCache.instance.getBlendState(false);
                        // todo: how to alpha test?
                        mtl.depthStencilState = RenderStateCache.instance.getDepthStencilState(true, true, GLDevice.gl.LEQUAL);
                        break;
                    case "BLEND":
                        mtl.blendState = RenderStateCache.instance.getBlendState(true);
                        mtl.depthStencilState = RenderStateCache.instance.getDepthStencilState(true, false, GLDevice.gl.LEQUAL);
                        break;
                }
            }

            if (mtlDef.doubleSided) {
                mtl.cullState = RenderStateCache.instance.getCullState(false);
            }

            // todo: fill mtl info
            // todo: get texture images; they must have been loaded by calling gltfAsset.prefetchAll()
            const pbrDef = mtlDef.pbrMetallicRoughness;
            if (pbrDef !== undefined) {
                if (pbrDef.baseColorFactor !== undefined) {
                    // mtl.color = new vec4([pbrDef.baseColorFactor[0], pbrDef.baseColorFactor[1], pbrDef.baseColorFactor[2], pbrDef.baseColorFactor[3]]);
                    this.numberArraytoVec(pbrDef.baseColorFactor, mtl.color);
                }
                if (pbrDef.metallicFactor !== undefined) mtl.metallic = pbrDef.metallicFactor;
                if (pbrDef.roughnessFactor !== undefined) mtl.roughness = pbrDef.roughnessFactor;

                // basecolor texture and metallicRoughness texture
                // according to the glTF specification, the baseColorFactor should multiply by baseColorTexture,
                // so amount should either be 0 or 1
                if (pbrDef.baseColorTexture !== undefined) {
                    mtl.colorMapAmount = 1;
                    mtl.colorMap = this.processTexture(pbrDef.baseColorTexture, gltf);
                }

                if (pbrDef.metallicRoughnessTexture !== undefined) {
                    mtl.metallicMapAmount = 1;
                    mtl.roughnessMapAmount = 1;
                    mtl.metallicRoughnessMap = this.processTexture(pbrDef.metallicRoughnessTexture, gltf);
                }

            }

            // emissive factor
            if (mtlDef.emissiveFactor !== undefined) {
                this.numberArraytoVec(mtlDef.emissiveFactor, mtl.emissive);
            }

            if (mtlDef.emissiveTexture !== undefined) {
                mtl.emissiveMapAmount = 1;
                mtl.emissiveMap = this.processTexture(mtlDef.emissiveTexture, gltf);
            }

            // normal texture and amount
            if (mtlDef.normalTexture !== undefined) {
                mtl.normalMapAmount = 1;
                if(mtlDef.normalTexture.scale !== undefined) {
                    mtl.normalMapAmount = mtlDef.normalTexture.scale;
                }
                mtl.normalMap = this.processTexture(mtlDef.normalTexture, gltf);
            }


            if (mtlDef.extras !== undefined) {
                // export specular intensity from blender to extras now.
                // maybe should use KHR_materials_specular in ther future, if blender-gltf-io exports it.
                if (mtlDef.extras.specular !== undefined) mtl.specular = mtlDef.extras.specular;

                // subsurface: save in gltf extra?
                // fix me: subsurface shader has problem now and the effect is weird 

                //     if(mtlDef.extras.subsurface !== undefined) mtl.subsurface = mtlDef.extras.subsurface;
                //     if(mtlDef.extras.subsurfColor !== undefined) mtl.subsurfaceColor.xyz = mtlDef.extras.subsurfColor;
                //     if (mtlDef.extras.subsurfaceRadius !== undefined) mtl.subsurfaceRadius = mtlDef.extras.subsurfaceRadius;
                // todo: subsurface thickness == subsurface radius?
                // todo: subsurface thickness texture?
            }
        }
        return mtl;
    }

    private numberArraytoVec(numbers: number[], result?: vec3 | vec4): vec3 | vec4 {
        let ret: vec3 | vec4 = result? result: new vec4();
        for(let i = 0; i < numbers.length && i < ret.values.length; i++) {
            ret.values[i] = numbers[i];
        }
        return ret;
    }

    private processTexture(textureInfo: TextureInfo | MaterialNormalTextureInfo | MaterialNormalTextureInfo, gltf: GltfAsset): Texture2D {
        if (gltf.gltf.textures === undefined) {
            throw new Error("No textures in gltf.");
        }

        if (gltf.gltf.images === undefined) {
            throw new Error("No images in gltf.");
        }

        if (textureInfo.index === undefined) {
            throw new Error("No index in texture info.");
        }

        const texDef = gltf.gltf.textures[textureInfo.index];
        if (texDef === undefined) {
            throw new Error("Texture with index not found in gltf.");
        }

        const texture = new Texture2D();

        if (texDef.sampler !== undefined && gltf.gltf.samplers !== undefined) {
            const sampDef = gltf.gltf.samplers[texDef.sampler];
            if (sampDef === undefined) {
                throw new Error("Sampler with index not found in gltf.");
            }
            // todo: create sampler state ?
            texture.samplerState = new SamplerState(sampDef.wrapS, sampDef.wrapT, sampDef.minFilter, sampDef.magFilter);
        } else {
            // use a default repeat state
            texture.samplerState = new SamplerState(GLDevice.gl.REPEAT, GLDevice.gl.REPEAT, GLDevice.gl.LINEAR_MIPMAP_LINEAR, GLDevice.gl.LINEAR);
        }

        if (texDef.source !== undefined) {
            const image = gltf.gltf.images[texDef.source];
            if (image === undefined) {
                throw new Error("Image with index not found in gltf.");
            }
            // should be already loaded by calling prefetchAll
            //const imageData = gltf.imageData.getSync(texDef.source);
            //imageData.then((img) => {
            const img = gltf.imageData.getSync(texDef.source);
            texture.image = img;
            texture.width = img.width;
            texture.height = img.height;
            texture.depth = 1;
            texture.mipLevels = 1;

            if (texture.samplerState !== null) {
                // decide generate mipmaps by sample state
                // only need to check minFilter, because mip-mapping only appear when minify
                // (according to gltf specification)
                if (texture.samplerState.minFilter === GLDevice.gl.LINEAR_MIPMAP_LINEAR
                    || texture.samplerState.minFilter === GLDevice.gl.LINEAR_MIPMAP_NEAREST
                    || texture.samplerState.minFilter === GLDevice.gl.NEAREST_MIPMAP_LINEAR
                    || texture.samplerState.minFilter === GLDevice.gl.NEAREST_MIPMAP_NEAREST) {
                    texture.mipLevels = 1024;
                }
            }

            // fix me: mark cached?
            // texture.cached
            texture.componentType = GLDevice.gl.UNSIGNED_BYTE;
            // jpeg or png?
            texture.format = GLDevice.gl.RGBA;
            // if mimetype presented, use it
            let isJPEG = false;
            if (image.mimeType !== undefined) {
                // isJPEG = (image.mimeType === "image/jpeg");
                isJPEG = image.mimeType.search(/\.jpe?g($|\?)/i) > 0;
            } else {
                if (image.uri !== undefined) {
                    isJPEG = image.uri.search(/\.jpe?g($|\?)/i) > 0 || image.uri.search(/^data\:image\/jpeg/) === 0;
                }
            }
            if (isJPEG) {
                texture.format = GLDevice.gl.RGB;
            }
            texture.upload();
            //});
        }

        // fix me: is that ok to return texture now?
        return texture;
    }

    private processAnimation(idx: number, animDef: Animation, nodes: Object3D[], gltf: GltfAsset): AnimationAction {
        // cache?
        const animKey: string = gltf.uri + ".anim" + idx;
        let animClip = AnimationCache.instance.get(animKey);
        if (animClip === undefined) {
            // todo: load keyframe tracks from gltf?
            const tracks: KeyframeTrack[] = [];

            // note: different samplers(KeyframeTracks) may share same input data.
            for (const samplerDef of animDef.samplers) {
                // accessor data
                const inputBytes = gltf.accessorDataSync(samplerDef.input);
                const outputBytes = gltf.accessorDataSync(samplerDef.output);

                // convert to Float32Array (will not copy, only ref to original data)
                const inputFloats = new Float32Array(inputBytes.buffer, inputBytes.byteOffset, inputBytes.length / 4);
                const outputFloats = new Float32Array(outputBytes.buffer, outputBytes.byteOffset, outputBytes.length / 4);

                const track = new KeyframeTrack(inputFloats, outputFloats);
                tracks.push(track);
            }
            animClip = new AnimationClip(animDef.name || "", tracks);
            AnimationCache.instance.add(animKey, animClip);
        }
        
        // create anim channels and samplers
        const channels: AnimationChannel[] = [];
        for (const channelDef of animDef.channels) {
            // target node and property
            if (channelDef.target.node === undefined) {
                throw new Error("Channel has no target node.")
            }

            // sampler idx === keyframetrack idx
            const samplerDef = animDef.samplers[channelDef.sampler];
            const sampler: AnimationSampler = new AnimationSampler(animClip.tracks[channelDef.sampler]);
            
            // stride and interpolation
            const animDataType = AnimTargetPathDataType[channelDef.target.path];
            sampler.stride = GLTF_ELEMENTS_PER_TYPE[animDataType];

            switch (samplerDef.interpolation) {
                case "LINEAR":
                    sampler.interpolation = Interpolation.LINEAR;
                    break;
                case "STEP":
                    sampler.interpolation = Interpolation.STEP;
                    break;
                case "CUBICSPLINE":
                    sampler.interpolation = Interpolation.CUBICSPLINE;
                    break;
                default:
                    break;
            }
            
            // if have animation, auto update local matrix by SRT
            nodes[channelDef.target.node].autoUpdateTransform = true;

            const channel: AnimationChannel = new AnimationChannel(nodes[channelDef.target.node], channelDef.target.path, sampler);
            channels.push(channel);
        }
        return new AnimationAction(animClip, channels);
    }
    // todo: handle instancing?
}
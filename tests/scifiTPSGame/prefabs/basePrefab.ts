import quat from "../../../lib/tsm/quat.js";
import vec3 from "../../../lib/tsm/vec3.js";
import { AnimationAction, AnimationMask, GltfAsset, Mesh, Object3D, PhysicsWorld, RigidBody, Scene, StandardPBRMaterial, Texture, TextureLoader } from "../../../src/mini3DEngine.js";

export abstract class BasePrefab {
    public constructor(assets: Map<string, GltfAsset>, physicsWorld: PhysicsWorld, scene: Scene, ) {
        this.gltfAssets = assets;
        this.physicsWorld = physicsWorld;
        this.scene = scene;
    }

    public abstract createGameObject(name: string, componentProps: any, position: vec3, rotation: quat, scale: vec3): Object3D;

    protected gltfAssets: Map<string, GltfAsset>;
    protected physicsWorld: PhysicsWorld;

    protected scene: Scene;

    public showMature: boolean = false;
    /** temperory */
    public matureSkinUrl: string = ";"

    protected prepareGLTFCharacter(gltfNode: Object3D) {
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

    protected setMatureSkinForCharacter(gltfNode: Object3D, textureLoader: TextureLoader) {
        if (gltfNode instanceof Mesh) {
            const mesh = gltfNode as Mesh;
            const skinMtl = mesh.materials.find((mtl)=>{return mtl.name === "Material.Skin.001"});
            if (skinMtl !== undefined && skinMtl instanceof StandardPBRMaterial) {
                const pbrSkinMtl = skinMtl as StandardPBRMaterial;
                // todo: how to define dirrerent NSFW textures for different characters?
                // const texturePromise: Promise<Texture> = textureLoader.loadPromise("./models/SCIFI/heroes/cyberGirl/SkinBaseColor_NSFW.png");
                const texturePromise: Promise<Texture> = textureLoader.loadPromise(this.matureSkinUrl);
                texturePromise.then((skinTex) => {
                    pbrSkinMtl.colorMap = skinTex;
                });
                return;
            }
        }

        for (const child of gltfNode.children) {
            this.setMatureSkinForCharacter(child, textureLoader);
        }
    }

    protected addJointHierarchyToLayerMask(rootJoint: Object3D, mask: AnimationMask) {
        mask.joints.push(rootJoint);
        for (const child of rootJoint.children) {
            this.addJointHierarchyToLayerMask(child, mask);
        }
    }
    
    protected getAnimationByName(animations: AnimationAction[], animName: string) {
        const anim = animations.find((anim: AnimationAction) => { return anim.name === animName; });
        if (anim === undefined) {
            throw new Error("Animation not found: " + animName);
        }
        return anim;
    }

    protected setRigidBodyProperties(body: RigidBody, componentProps: any) {
        // is it necessary to check value types?
        if (componentProps["RigidBody.mass"] !== undefined) {
            body.body.mass = componentProps["RigidBody.mass"];
        }
        if (componentProps["RigidBody.collisionFilterGroup"] !== undefined) {
            body.body.collisionFilterGroup = componentProps["RigidBody.collisionFilterGroup"];
        }
        if (componentProps["RigidBody.collisionFilterMask"] !== undefined) {
            body.body.collisionFilterMask = componentProps["RigidBody.collisionFilterMask"];
        }
    }
}
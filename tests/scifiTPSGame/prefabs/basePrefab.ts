import { AnimationAction, AnimationMask, Mesh, Object3D, StandardPBRMaterial, Texture, TextureLoader } from "../../../src/mini3DEngine.js";

export abstract class BasePrefab {
    public abstract createGameObject(componentProps: any): Object3D;

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
                // load texture?
                const texturePromise: Promise<Texture> = textureLoader.loadPromise("./models/SCIFI/heroes/cyberGirl/SkinBaseColor_NSFW.png");
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
}
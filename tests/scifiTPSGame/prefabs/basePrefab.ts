import { Mesh, Object3D, StandardPBRMaterial, Texture, TextureLoader } from "../../../src/mini3DEngine.js";

export class BasePrefab {
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
}
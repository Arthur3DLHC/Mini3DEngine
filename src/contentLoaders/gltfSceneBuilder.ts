import { GltfAsset } from "./gltfAsset.js";
import { Scene } from "../scene/scene.js";
import { GlTfId, GlTf } from "./gltf.js";
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

export class GLTFSceneBuilder {
    public constructor() {
        this._meshReferences = [];
    }

    // todo: extension parser?
    // todo: custom extra parser?

    private _meshReferences: number[];

    /**
     * build scene hierarchy from gltf asset. NOTE: don't call this before all binary datas has been loaded.
     * @param gltf the GlTf asset data
     * @param sceneIdx 
     */
    public build(gltf: GltfAsset, sceneIdx: number): Scene {

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
        const scene = new Scene();

        // clear mesh reference numbers every time.
        this._meshReferences = [];
        if (gltf.gltf.meshes !== undefined) {
            for (let i = 0; i < gltf.gltf.meshes?.length; i++) {
                this._meshReferences.push(0);
            }   
        }

        for (const nodeID of sceneDef.nodes) {
            this.processNode(nodeID, scene, gltf);
        }

        return scene;
    }

    private processNode(nodeId: GlTfId, parentObject: Object3D, gltf: GltfAsset) {
        // todo: check if node is mesh, joint?
        // todo: iterate childs
        if (gltf.gltf.nodes === undefined) {
            throw new Error("No nodes in gltf.");
        }

        const nodeDef = gltf.gltf.nodes[nodeId];

        if (nodeDef === undefined) {
            throw new Error("Node not found.");
        }

        let node: Object3D;
        if (nodeDef.mesh !== undefined) {
            if (this._meshReferences[nodeDef.mesh] > 0) {
                // todo: handle instancing; create a new instance referencing same geometry;
                // and render mesh using instancing mode
                node = this.processMesh(nodeDef.mesh, gltf);
            } else {
                node = this.processMesh(nodeDef.mesh, gltf);
            }
            this._meshReferences[nodeDef.mesh]++;
        }
        else {
            // todo: if is joint?
            node = new Object3D();
        }

        parentObject.attachChild(node);

        // todo: node transform
        // todo: hold translation, rotation, scale in Object3D？
        if (nodeDef.matrix !== undefined) {
            node.localTransform.init(nodeDef.matrix);
            // todo: decompose matrix ?
            node.localTransform.getScaling(node.scale);
            node.localTransform.getRotation(node.rotation);
            node.localTransform.getTranslation(node.translation);
        } else {
            if (nodeDef.translation !== undefined) {
                node.translation = new vec3([nodeDef.translation[0], nodeDef.translation[1], nodeDef.translation[2]]);
            }

            if (nodeDef.rotation !== undefined) {
                node.rotation = new quat([nodeDef.rotation[0], nodeDef.rotation[1], nodeDef.rotation[2], nodeDef.rotation[3]]);
            }

            if (nodeDef.scale !== undefined) {
                node.scale = new vec3([nodeDef.scale[0], nodeDef.scale[1], nodeDef.scale[2]]);
            }

            // todo: update local matrix or update it later when scene update every frame?
        }

        if (nodeDef.children !== undefined) {
            for (const childId of nodeDef.children) {
                this.processNode(childId, node, gltf);
            }
        }
    }

    private processJoint() {

    }

    /**
     * 
     * @param meshId 
     * @param gltf 
     * @returns if mesh only has 1 primitive, return a mesh object; or return an object3d node with multiple mesh children.
     */
    private processMesh(meshId: GlTfId, gltf: GltfAsset): Mesh | Object3D {
        if (gltf.gltf.meshes === undefined) {
            throw new Error("No meshes in gltf.");
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

        for (const primDef of meshDef.primitives) {
            // geometry
            const mesh = new Mesh();
            mesh.geometry = new BufferGeometry();
    
            // todo: attributes, vertexbuffer, indexbuffer

            // in gltf, one primitive only has one material
            const prim = new Primitive(0, Infinity, 0);
            mesh.geometry.primitives.push(prim);

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

    private processMaterial(mtlId: GlTfId, gltf: GltfAsset): StandardPBRMaterial {
        const mtl = new StandardPBRMaterial();
        if (gltf.gltf.materials !== undefined) {
            const mtlDef = gltf.gltf.materials[mtlId];

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
                    // todo: create texture from image
                }

                if (pbrDef.metallicRoughnessTexture !== undefined) {
                    mtl.metallicMapAmount = 1;
                    mtl.roughnessMapAmount = 1;
                    // todo: create texture from image
                }

            }

            // todo: emissive factor
            if (mtlDef.emissiveFactor !== undefined) {
                this.numberArraytoVec(mtlDef.emissiveFactor, mtl.emissive);
            }

            // normal texture and amount

            // todo: subsurface?
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

    // todo: handle instancing?
}
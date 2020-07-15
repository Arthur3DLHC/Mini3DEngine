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

    private processMesh(meshId: GlTfId, gltf: GltfAsset): Mesh {
        if (gltf.gltf.meshes === undefined) {
            throw new Error("No meshes in gltf.");
        }
        // what if no materials in gltf?
        // use a default mtl? or ignore mtls?
        const meshDef = gltf.gltf.meshes[meshId];
        if (meshDef === undefined) {
            throw new Error("Mesh not found in meshes array");
        }
        
        const mesh = new Mesh();
        mesh.geometry = new BufferGeometry();

        // todo: attributes, vertexbuffer, indexbuffer

        for (const primDef of meshDef.primitives) {
            // geometry


            // material
            if(primDef.material !== undefined) {
                // todo: set material index of primitive group
                const prim = new Primitive(0, 0, primDef.material);
                mesh.geometry.primitives.push(prim);
                mesh.materials.push(this.processMaterial(primDef.material, gltf));
            } else {
                // add a default material?
            }
        }

        // todo: if mesh has skin info

        return mesh;
    }

    private processMaterial(mtlId: GlTfId, gltf: GltfAsset): StandardPBRMaterial {
        const mtl = new StandardPBRMaterial();
        if (gltf.gltf.materials !== undefined) {
            const mtlDef = gltf.gltf.materials[mtlId];

            // todo: fill mtl info

        }
        return mtl;
    }

    // todo: handle instancing?
}
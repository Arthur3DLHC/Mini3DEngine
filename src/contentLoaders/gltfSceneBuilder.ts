import { GltfAsset, GLTF_EXTENSIONS, GLTF_ATTRIBUTES, GLTF_ELEMENTS_PER_TYPE, GLTF_COMPONENT_TYPE_ARRAYS } from "./gltfAsset.js";
import { Scene } from "../scene/scene.js";
import { GlTfId, GlTf, TextureInfo } from "./gltf.js";
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
import { VertexBufferAttribute } from "../WebGLResources/vertexBufferAttribute.js";
import { VertexBuffer } from "../WebGLResources/vertexBuffer.js";
import { IndexBuffer } from "../WebGLResources/indexBuffer.js";

export class GLTFSceneBuilder {
    public constructor() {
        this._meshReferences = [];
    }

    // todo: extension parser?
    // todo: custom extra parser?

    private _meshReferences: number[];

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
                node = this.processMesh(nodeDef.mesh, nodeDef.skin !== undefined, gltf);
            } else {
                node = this.processMesh(nodeDef.mesh, nodeDef.skin !== undefined, gltf);
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
    private processMesh(meshId: GlTfId, isSkin: boolean, gltf: GltfAsset): Object3D {
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

        for (const primDef of meshDef.primitives) {
            // geometry
            const mesh = new Mesh();
            mesh.geometry = new BufferGeometry();

            // use bufferview index?
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

                        // todo: copy data from bufferview to vertex buffer
                        vb.data = accessorData;
                        if (bufferView.byteStride) {
                            vb.stride = bufferView.byteStride;
                        } else {
                            vb.stride = itemBytes;
                        }
                        vb.create();

                        vertexBuffers.set(vbKey, vb);
                    }

                    const vbAttr = new VertexBufferAttribute(attrname, vb, itemSize, byteOffset);
                    vertexAttributes.push(vbAttr);
                }
            }

            for (const vertexBuffer of vertexBuffers.values()) {
                mesh.geometry.vertexBuffers.push(vertexBuffer);
            }

            for (const vertexAttribute of vertexAttributes) {
                mesh.geometry.attributes.push(vertexAttribute);
            }
    
            // indices
            if (primDef.indices !== undefined) {
                const accessorData = gltf.accessorDataSync(primDef.indices);
                const accessor = gltf.gltf.accessors[primDef.indices];
                mesh.geometry.indexBuffer = new IndexBuffer(GLDevice.gl.STATIC_DRAW);
                mesh.geometry.indexBuffer.indices = accessorData;
                mesh.geometry.indexBuffer.componentType = accessor.componentType;
                mesh.geometry.indexBuffer.create();
            }

            // todo: primitive draw mode
            if (primDef.mode === GLDevice.gl.TRIANGLES
                || primDef.mode === GLDevice.gl.TRIANGLE_FAN
                || primDef.mode === GLDevice.gl.TRIANGLE_STRIP
                || primDef.mode === undefined) {
                // is this a skin mesh?

            } else if (primDef.mode === GLDevice.gl.LINES
                || primDef.mode === GLDevice.gl.LINE_STRIP
                || primDef.mode === GLDevice.gl.LINE_LOOP) {
                
            } else if (primDef.mode === GLDevice.gl.POINTS) {

            }

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
                mtl.normalMap = this.processTexture(mtlDef.normalTexture.index, gltf);
            }

            // todo: subsurface? save in gltf extra?
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

    private processTexture(textureInfo: TextureInfo, gltf: GltfAsset): Texture2D {
        if (gltf.gltf.textures === undefined) {
            throw new Error("No textures in gltf.");
        }

        if (gltf.gltf.images === undefined) {
            throw new Error("No images in gltf.");
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
                texture.width = img.width;
                texture.height = img.height;
                texture.depth = 1;
                // decide generate mipmaps by sample state
                if (texture.samplerState?.magFilter === GLDevice.gl.LINEAR_MIPMAP_LINEAR
                    || texture.samplerState?.magFilter === GLDevice.gl.LINEAR_MIPMAP_NEAREST
                    || texture.samplerState?.magFilter === GLDevice.gl.NEAREST_MIPMAP_LINEAR
                    || texture.samplerState?.magFilter === GLDevice.gl.NEAREST_MIPMAP_NEAREST) {
                    texture.mipLevels = 1024;
                } else {
                    texture.mipLevels = 1;
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
                    isJPEG = image.mimeType.search( /\.jpe?g($|\?)/i ) > 0;
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

    // todo: handle instancing?
}
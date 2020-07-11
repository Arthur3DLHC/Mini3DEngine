import { GlTf } from "./gltf.js";
import { GLTFBinaryData } from "./gltfBinaryData.js";
import { LoadingManager } from "../mini3DEngine.js";

/** Spec: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#accessor-element-size */
export const GLTF_COMPONENT_TYPE_ARRAYS: { [index: number]: any } = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
};

/** Spec: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#accessor-element-size */
export const GLTF_ELEMENTS_PER_TYPE: { [index: string]: number } = {
    SCALAR: 1,
    VEC2:   2,
    VEC3:   3,
    VEC4:   4,
    MAT2:   4,
    MAT3:   9,
    MAT4:  16,
};

export class GltfAsset {
    // todo
    constructor(gltf: GlTf, baseUri: string, glbData: GLTFBinaryData | undefined,
        manager: LoadingManager = new LoadingManager()) {

        // this.gltf = gltf;
        // this.glbData = glbData;
        // this.bufferData = new BufferData(this, baseUri, manager);
        // this.imageData = new ImageData(this, baseUri, manager);
    }
}
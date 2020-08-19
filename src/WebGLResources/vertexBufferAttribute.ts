import { VertexBuffer } from "./vertexBuffer.js";
import { GLDevice } from "./glDevice.js";

export class VertexBufferAttribute {
    /**
     * 
     * @param name 
     * @param buffer 
     * @param size number of components
     * @param componentType 
     * @param offset 
     */
    public constructor(name: string, buffer: VertexBuffer, size: number, componentType: GLenum, offset: number, locationOffset?: number) {
        this.name = name;
        this.buffer = buffer;
        this.size = size;
        this.componentType = componentType;
        this.offset = offset;
        this.divisor = 0;
        this.locationOffset = 0;
        if (locationOffset !== undefined) {
            this.locationOffset = locationOffset;
        }
    }

    // compatible with gltf file
    public static readonly defaultNamePosition = "a_position";
    public static readonly defaultNameNormal = "a_normal";
    public static readonly defaultNameTexcoord0 = "a_texcoord0";
    public static readonly defaultNameTexcoord1 = "a_texcoord1";
    public static readonly defaultNameTangent = "a_tangent";
    public static readonly defaultNameColor0 = "a_color0";
    public static readonly defaultNameJoints0 = "a_joints0";
    public static readonly defaultNameWeights0 = "a_weights0";

    public static readonly defaultNameInstMatrix = "a_instanceMatrix";
    public static readonly defaultNameInstColor = "a_instanceColor";

    // vertex buffer (shared? interleaved)
    public buffer: VertexBuffer;
    
    // attribute name?
    /**
     * attribute name, for look up in shader;
     */
    public name: string;

    /**
     * number components (floats) of this attribute
     */
    public size: number;

    /**
     * component type
     */
    public componentType: GLenum;

    /**
     * offset in bytes
     */
    public offset: number;

    /**
     * for mat4 like type attributes.
     */
    public locationOffset: number;

    /**
     * if not zero, instanced.
     * (if 0, vertex attrib advances per vertex; if not 0, vertex attrib advances per divisor instances)
     */
    public divisor: number;

    /**
     * get a vertex part of this attribute from buffer
     * @param index vertex index
     * @param result receive get result
     */
    public getVertex(index: number, result: number[]) {
        if (this.buffer.data === null) {
            throw new Error("no data in vertex buffer");
        }

        // const dataView = new DataView(this.buffer.data.buffer);

        // todo: may have other types? such as Uint32 color?
        if(this.componentType === GLDevice.gl.FLOAT) {
            const typebuffer = new Float32Array(this.buffer.data.buffer, this.buffer.data.byteOffset, this.buffer.data.byteLength / 4);

            const strideInFloats = this.buffer.stride / 4;
            const offsetInFloats = this.offset / 4;
            const startIdx = index * strideInFloats + offsetInFloats;
    
            for (let i = 0; i < this.size; i++) {
                // let val: number = 0;
                // switch(this.componentType) {
                //     case 5125:
                //         val = dataView.getUint32(index * this.buffer.stride + this.offset + i * 4);
                //         break;
                //     case 5126:
                //         val = dataView.getFloat32(index * this.buffer.stride + this.offset + i * 4);
                //         break;
                // }
                //result[i] = val;
                //result[i] = this.buffer.data[startIdx + i];
                result[i] = typebuffer[startIdx + i];
            }
        } else {
            throw new Error("Not implemented.");
        }
    }
}
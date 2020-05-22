import { VertexBuffer } from "./vertexBuffer.js";

export class VertexBufferAttribute {
    public constructor(name: string, buffer: VertexBuffer, size: number, offset: number) {
        this.name = name;
        this.buffer = buffer;
        this.size = size;
        this.offset = offset;
    }

    public static readonly defaultNamePosition = "a_position";
    public static readonly defaultNameNormal = "a_normal";
    public static readonly defaultNameTexcoord0 = "a_texcoord0";
    // todo: tangent, binormal, skinindex, skinweight...

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
     * offset in bytes?
     */
    public offset: number;

    /**
     * get a vertex part of this attribute from buffer
     * @param index vertex index
     * @param result receive get result
     */
    public getVertex(index: number, result: number[]) {
        if (this.buffer.data === null) {
            throw new Error("no data in vertex buffer");
        }
        const strideInFloats = this.buffer.stride / 4;
        const offsetInFloats = this.offset / 4;
        const startIdx = index * strideInFloats + offsetInFloats;
        for (let i = 0; i < this.size; i++) {
            result[i] = this.buffer.data[startIdx + i];
        }
    }
}
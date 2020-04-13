import { VertexBuffer } from "./vertexBuffer.js";

export class VertexBufferAttribute {
    public constructor(name: string, buffer: VertexBuffer, size: number, offset: number) {
        this.name = name;
        this.buffer = buffer;
        this.size = size;
        this.offset = offset;
    }

    // vertex buffer (shared? interleaved)
    public buffer: VertexBuffer;
    
    // attribute name?
    public name: string;

    // size and offset
    /**
     * size in bytes?
     */
    public size: number;

    /**
     * offset in bytes?
     */
    public offset: number;
}
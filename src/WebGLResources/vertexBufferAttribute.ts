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
}
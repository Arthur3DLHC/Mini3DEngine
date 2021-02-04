import { COMPONENT_BYTE_SIZES } from "./componentSize.js";
import { VertexBuffer } from "./vertexBuffer.js";
import { VertexBufferAttribute } from "./vertexBufferAttribute.js";

/**
 * utility class to collect a set of vertex buffer attributes
 */
export class VertexBufferAttributeSet {
    private _attributes: VertexBufferAttribute[] = [];
    private _curOffset: number = 0;

    public get attributes() { return this._attributes; }

    public addAttribute(name: string, location: number, vertexBuffer: VertexBuffer, size: number, componentType: GLenum, divisor?: number) {
        this.attributes.push(new VertexBufferAttribute(name, location, vertexBuffer, size, componentType, this._curOffset, divisor));
        this._curOffset += size * COMPONENT_BYTE_SIZES[componentType];
    }
}
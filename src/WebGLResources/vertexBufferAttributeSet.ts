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
    public get curSizeInBytes() { return this._curOffset; }
    public set curSizeInBytes(val: number) { this._curOffset = val;}

    /**
     * add an attribute. will calc it's offset automatically.
     * note: if pass in a new vertex buffer, must set VertexBufferAttributeSet.curSizeInBytes to zero to ensure the offset is correct.
     * @param name 
     * @param location 
     * @param vertexBuffer 
     * @param size number components
     * @param componentType 
     * @param divisor 
     */
    public addAttribute(name: string, location: number, vertexBuffer: VertexBuffer, size: number, componentType: GLenum, divisor?: number) {
        this.attributes.push(new VertexBufferAttribute(name, location, vertexBuffer, size, componentType, this._curOffset, divisor));
        this._curOffset += size * COMPONENT_BYTE_SIZES[componentType];
    }
}
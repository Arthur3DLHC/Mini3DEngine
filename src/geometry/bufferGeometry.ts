import { PrimitiveGroup } from "./primitiveGroup.js";
import { VertexBufferAttribute } from "../WebGLResources/vertexBufferAttribute.js";
import { VertexBuffer } from "../WebGLResources/vertexBuffer.js";
import { IndexBuffer } from "../WebGLResources/indexBuffer.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { GLGeometryBuffers } from "../WebGLResources/glGeometryBuffers.js";

export class BufferGeometry {
    public constructor() {
        this.attributes = [];
        this.vertexBuffer = null;
        this.indexBuffer = null;
        this.groups = [];
        this.drawMode = GLDevice.gl.TRIANGLES;
    }

    // vertex attributes
    public attributes: VertexBufferAttribute[];

    // vbo
    public vertexBuffer: VertexBuffer | null;
    
    // ibo
    public indexBuffer: IndexBuffer | null;

    // groups
    public groups: PrimitiveGroup[];

    // todo: geometry type?
    public drawMode: GLenum;

    public draw(start: number, count: number, attribLocations: Map<string, number>, mode: GLenum|null = null) {
        if (!this.vertexBuffer || !this.vertexBuffer.data || !this.vertexBuffer.glBuffer) {
            return;
        }
        GLGeometryBuffers.bindVertexBuffer(this.vertexBuffer);
        GLGeometryBuffers.clearVertexAttributes();
        for (const attr of this.attributes) {
            GLGeometryBuffers.setVertexAttribute(attr, attribLocations);
        }
        GLGeometryBuffers.disableUnusedAttributes();

        if (this.indexBuffer && this.indexBuffer.indices && this.indexBuffer.glBuffer) {
            GLGeometryBuffers.bindIndexBuffer(this.indexBuffer);
            const s = Math.max(0, start);
            const c = Math.min(count, this.indexBuffer.indices.length - s);
            // drawElements 时需要用 byte 偏移, int16 = 2 bytes
            GLDevice.gl.drawElements(mode?mode:this.drawMode, c, GLDevice.gl.UNSIGNED_SHORT, s * 2);
        } else {
            // draw array 时不用 byte 偏移
            const s = Math.max(0, start);
            const c = Math.min(count, this.vertexBuffer.data.length - s);
            GLDevice.gl.drawArrays(mode?mode:this.drawMode, s, c);
        }
    }

    // todo: instanced?

    public destroy() {
        if (this.vertexBuffer) {
            this.vertexBuffer.release();
            this.vertexBuffer = null;
        }
        if (this.indexBuffer) {
            this.indexBuffer.release();
            this.indexBuffer = null;
        }
    }
    
    /**
     * returns new offset in bytes
     * @param name 
     * @param vertexBuffer 
     * @param size number elements of this attribute
     * @param offset offset in bytes
     */
    protected addAttribute(name: string, vertexBuffer: VertexBuffer, size: number, offset: number): number {
        this.attributes.push(new VertexBufferAttribute(name, vertexBuffer, size, offset));
        return offset + size * 4;
    }
}
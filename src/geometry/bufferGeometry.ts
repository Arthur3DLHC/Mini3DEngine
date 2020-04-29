import { PrimitiveGroup } from "./primitiveGroup";
import { VertexBufferAttribute } from "../WebGLResources/vertexBufferAttribute";
import { VertexBuffer } from "../WebGLResources/vertexBuffer";
import { IndexBuffer } from "../WebGLResources/indexBuffer";
import { GLDevice } from "../WebGLResources/glDevice";
import { GLGeometryBuffers } from "../WebGLResources/glGeometryBuffers";

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

    public draw(start: number, count: number, mode: GLenum|null = null) {
        if (!this.vertexBuffer || !this.vertexBuffer.data || !this.vertexBuffer.glBuffer) {
            return;
        }
        GLGeometryBuffers.bindVertexBuffer(this.vertexBuffer);
        for (const attr of this.attributes) {
            GLGeometryBuffers.setVertexAttribute(attr);
        }
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
}
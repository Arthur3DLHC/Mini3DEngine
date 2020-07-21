import { Primitive } from "./primitive.js";
import { VertexBufferAttribute } from "../WebGLResources/vertexBufferAttribute.js";
import { VertexBuffer } from "../WebGLResources/vertexBuffer.js";
import { IndexBuffer } from "../WebGLResources/indexBuffer.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { GLGeometryBuffers } from "../WebGLResources/glGeometryBuffers.js";
import { BoundingSphere } from "../math/boundingSphere.js";
import vec3 from "../../lib/tsm/vec3.js";
import { BoundingBox } from "../math/boundingBox.js";

export class BufferGeometry {
    public constructor() {
        this.attributes = [];
        this.vertexBuffers = [];
        this.indexBuffer = null;
        this.primitives = [];
        this.drawMode = GLDevice.gl.TRIANGLES;
        this.boundingSphere = new BoundingSphere();
    }

    // vertex attributes
    public attributes: VertexBufferAttribute[];

    // vbo
    // todo: support multiple vertex buffers? for non-interleaved buffer in glTF?
    public vertexBuffers: VertexBuffer[];
    
    // ibo
    public indexBuffer: IndexBuffer | null;

    // primitives
    public primitives: Primitive[];

    // todo: geometry type?
    public drawMode: GLenum;

    public boundingSphere: BoundingSphere;

    public draw(start: number, count: number, attribLocations: Map<string, number>, mode: GLenum|null = null) {
        // if (!this.vertexBuffer || !this.vertexBuffer.data || !this.vertexBuffer.glBuffer) {
        //     return;
        // }
        if (this.vertexBuffers.length <= 0 || this.attributes.length <= 0) {
            // todo: log error? or throw exception?
            console.warn("BufferGeometry.draw(): No vertex buffer or attributes found.");
            return;
        }
        GLGeometryBuffers.clearVertexAttributes();

        // GLGeometryBuffers.bindVertexBuffer(this.vertexBuffer);
        // 在 OpenGL 中只要将 VertexBufferObject 绑定到 Vertex attribute pointer 上，就可以直接用后者绘制了，不用再绑定 VBO
        for (const attr of this.attributes) {
            if (attr.buffer.data === null || attr.buffer.glBuffer === null) {
                throw new Error("Vertex buffer is empty or not created");
            }
            GLGeometryBuffers.bindVertexBuffer(attr.buffer);
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
            const c = Math.min(count, this.vertexBuffers[0].vertexCount - s);
            GLDevice.gl.drawArrays(mode?mode:this.drawMode, s, c);
        }
    }

    // todo: draw instanced?
    // pass in attributes of instancing data?
    public drawInstaces(start: number, count: number, attribLocations: Map<string, number>, instanceAttribs: VertexBufferAttribute[], instanceCount: number, mode: GLenum|null = null) {
        if (this.vertexBuffers.length <= 0 || this.attributes.length <= 0  || instanceAttribs.length <= 0) {
            // todo: log error? or throw exception?
            console.warn("BufferGeometry.draw(): No vertex buffer or attributes found.");
            return;
        }
        // if (!this.vertexBuffer || !this.vertexBuffer.data || !this.vertexBuffer.glBuffer || instanceAttribs.length <= 0) {
        //     return;
        // }
        GLGeometryBuffers.clearVertexAttributes();
        // bind geometry vertex buffer
        for (const attr of this.attributes) {
            if (attr.buffer.data === null || attr.buffer.glBuffer === null) {
                throw new Error("Vertex buffer is empty or not created");
            }
            GLGeometryBuffers.bindVertexBuffer(attr.buffer);
            GLGeometryBuffers.setVertexAttribute(attr, attribLocations);
        }

        // don't forget bind vertex buffer of instanceAttribs
        for (const attr of instanceAttribs) {
            GLGeometryBuffers.bindVertexBuffer(attr.buffer);
            GLGeometryBuffers.setVertexAttribute(attr, attribLocations);
        }

        GLGeometryBuffers.disableUnusedAttributes();

        if (this.indexBuffer && this.indexBuffer.indices && this.indexBuffer.glBuffer) {
            GLGeometryBuffers.bindIndexBuffer(this.indexBuffer);
            const s = Math.max(0, start);
            const c = Math.min(count, this.indexBuffer.indices.length - s);
            // drawElements 时需要用 byte 偏移, int16 = 2 bytes
            GLDevice.gl.drawElementsInstanced(mode?mode:this.drawMode, c, GLDevice.gl.UNSIGNED_SHORT, s * 2, instanceCount);
        } else {
            // draw array 时不用 byte 偏移
            const s = Math.max(0, start);
            const c = Math.min(count, this.vertexBuffers[0].vertexCount - s);
            GLDevice.gl.drawArraysInstanced(mode?mode:this.drawMode, s, c, instanceCount);
        }
    }

    public destroy() {
        for (const vertexBuffer of this.vertexBuffers) {
            if (vertexBuffer) {
                vertexBuffer.release();
            }
        }
        this.vertexBuffers = [];

        if (this.indexBuffer) {
            this.indexBuffer.release();
            this.indexBuffer = null;
        }
    }
    
    public computeBoundingSphere() {
        // get the position attribute first
        const box = new BoundingBox();
        const vp: vec3 = new vec3();
        const positions = this.attributes.find(e => e.name === VertexBufferAttribute.defaultNamePosition);
        if (positions) {
            // iterate all positions, calculate center
            // from three.js,
            // us a box center is better than average center
            let p: number[] = [0, 0, 0];
            for (let i = 0; i < positions.buffer.vertexCount; i++) {
                positions.getVertex(i, p);
                vp.x = p[0];
                vp.y = p[1];
                vp.z = p[2];
                box.expandByPoint(vp);
            }

            // iterate all positions, calculate max distance to center (radius)
            this.boundingSphere.center = box.center;
            let distSq = 0;
            for (let i = 0; i < positions.buffer.vertexCount; i++) {
                positions.getVertex(i, p);
                vp.x = p[0] - this.boundingSphere.center.x;
                vp.y = p[1] - this.boundingSphere.center.y;
                vp.z = p[2] - this.boundingSphere.center.z;
                distSq = Math.max(distSq, vp.x * vp.x + vp.y * vp.y + vp.z * vp.z);
            }
            this.boundingSphere.radius = Math.sqrt(distSq);
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
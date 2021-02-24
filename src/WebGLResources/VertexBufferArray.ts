import { GLDevice } from "./glDevice.js";
import { GLGeometryBuffers } from "./glGeometryBuffers.js";
import { IndexBuffer } from "./indexBuffer.js";
import { VertexBufferAttribute } from "./vertexBufferAttribute.js";

/**
 * OpenGL vertex buffer array object
 */
export class VertexBufferArray {

    public glArray: WebGLVertexArrayObject | null = null;

    private attributes: VertexBufferAttribute[] = [];

    // prepare
    public prepare(attributes: VertexBufferAttribute[], indexBuffer: IndexBuffer | null) {
        // check
        if (attributes.length === 0) {
            throw new Error("vertex attributes is empty");
        }
        
        const gl = GLDevice.gl;
        if (!this.glArray) {
            this.glArray = gl.createVertexArray();
        }

        this.attributes = attributes;

        // gl.bindVertexArray(this.glArray);
        GLGeometryBuffers.bindVertexBufferArray(this);

        for (const attr of attributes) {
            gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer.glBuffer);
            gl.enableVertexAttribArray(attr.location + attr.locationOffset);
            gl.vertexAttribPointer(attr.location + attr.locationOffset, attr.size, attr.componentType, false, attr.buffer.stride, attr.offset);
            gl.vertexAttribDivisor(attr.location + attr.locationOffset, attr.divisor);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        if (indexBuffer !== null) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.glBuffer);
        }

        GLGeometryBuffers.bindVertexBufferArray(null);
        // gl.bindVertexArray(null);
    }

    public release() {
        if (this.glArray) {
            GLDevice.gl.deleteVertexArray(this.glArray);
            this.glArray = null;
        }
    }
}
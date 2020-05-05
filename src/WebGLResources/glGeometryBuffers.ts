import { VertexBuffer } from "./vertexBuffer.js";
import { IndexBuffer } from "./indexBuffer.js";
import { GLDevice } from "./glDevice.js";
import { VertexBufferAttribute } from "./vertexBufferAttribute.js";
import { ShaderProgram } from "./shaderProgram.js";

export class GLGeometryBuffers {
    private static _vertexBuffer: VertexBuffer | null = null;
    private static _indexBuffer: IndexBuffer | null = null;
    // todo: vertex attribute pointers?

    public static bindVertexBuffer(vertexBuffer: VertexBuffer|null) {
        if (this._vertexBuffer !== vertexBuffer) {
            this._vertexBuffer = vertexBuffer;
            if (this._vertexBuffer) {
                GLDevice.gl.bindBuffer(GLDevice.gl.ARRAY_BUFFER, this._vertexBuffer.glBuffer);
            } else {
                GLDevice.gl.bindBuffer(GLDevice.gl.ARRAY_BUFFER, null);
            }
        }
    }

    public static bindIndexBuffer(indexBuffer: IndexBuffer|null) {
        if (this._indexBuffer !== indexBuffer) {
            this._indexBuffer = indexBuffer;
            if (this._indexBuffer) {
                GLDevice.gl.bindBuffer(GLDevice.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer.glBuffer);
            } else {
                GLDevice.gl.bindBuffer(GLDevice.gl.ELEMENT_ARRAY_BUFFER, null);
            }
        }
    }

    public static setVertexAttribute(attrib: VertexBufferAttribute, attribLocations: Map<string, number>) {
        const index = attribLocations.get(attrib.name);
        if (index) {
            GLDevice.gl.enableVertexAttribArray(index);
            GLDevice.gl.vertexAttribPointer(index, attrib.size, GLDevice.gl.FLOAT, false, attrib.buffer.stride, attrib.offset);
        }
    }

    // todo: disable unused attribs
}
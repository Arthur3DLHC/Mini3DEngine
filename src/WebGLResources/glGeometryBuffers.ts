import { VertexBuffer } from "./vertexBuffer.js";
import { IndexBuffer } from "./indexBuffer.js";
import { GLDevice } from "./glDevice.js";
import { VertexBufferAttribute } from "./vertexBufferAttribute.js";
import { ShaderProgram } from "./shaderProgram.js";

export class GLGeometryBuffers {
    private static _vertexBuffer: VertexBuffer | null = null;
    private static _indexBuffer: IndexBuffer | null = null;
    // todo: vertex attribute pointers?
    private static _enabledAttributes: Uint8Array;
    private static _newAttributes: Uint8Array;
    
    public static initialize() {
        const maxAttribs = GLDevice.gl.getParameter(GLDevice.gl.MAX_VERTEX_ATTRIBS);
        GLGeometryBuffers._enabledAttributes = new Uint8Array(maxAttribs);
        GLGeometryBuffers._newAttributes = new Uint8Array(maxAttribs);
    }

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

    public static clearVertexAttributes() {
        // clear newattribs
        for (let i = 0; i < this._newAttributes.length; i++) {
            this._newAttributes[i] = 0;
        }
    }

    public static setVertexAttribute(attrib: VertexBufferAttribute, attribLocations: Map<string, number>) {
        const index = attribLocations.get(attrib.name);
        if (index) {
            this._newAttributes[index] = 1;
            if (this._enabledAttributes[index] === 0) {
                GLDevice.gl.enableVertexAttribArray(index);
                this._enabledAttributes[index] = 1;
            }

            GLDevice.gl.vertexAttribPointer(index, attrib.size, GLDevice.gl.FLOAT, false, attrib.buffer.stride, attrib.offset);
        }
    }

    public static disableUnusedAttributes() {
        for (let i = 0; i < this._enabledAttributes.length; i++) {
            if(this._enabledAttributes[i] !== this._newAttributes[i]) {
                GLDevice.gl.disableVertexAttribArray(i);
                this._enabledAttributes[i] = 0;
            }
        }
    }
}
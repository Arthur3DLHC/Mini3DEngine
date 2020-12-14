import { VertexBuffer } from "./vertexBuffer.js";
import { IndexBuffer } from "./indexBuffer.js";
import { GLDevice } from "./glDevice.js";
import { VertexBufferAttribute } from "./vertexBufferAttribute.js";

export class GLGeometryBuffers {
    private static _vertexBuffer: VertexBuffer | null = null;
    private static _indexBuffer: IndexBuffer | null = null;
    // learned form three.js
    private static _enabledAttributes: Uint8Array;
    private static _newAttributes: Uint8Array;
    private static _attribDivisors: Uint8Array;
    
    public static initialize() {
        const maxAttribs = GLDevice.gl.getParameter(GLDevice.gl.MAX_VERTEX_ATTRIBS);
        GLGeometryBuffers._enabledAttributes = new Uint8Array(maxAttribs);
        GLGeometryBuffers._newAttributes = new Uint8Array(maxAttribs);
        GLGeometryBuffers._attribDivisors = new Uint8Array(maxAttribs);
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
            // do not clear divisors, or will not call gl.vertexAttribDivisor later
            // this._attribDivisors[i] = 0;
        }
    }

    public static enableVertexAttributes(attribLocations: Map<string, number>) {
        attribLocations.forEach((index, name, map) => {
            this._newAttributes[index] = 1;
            if (this._enabledAttributes[index] === 0) {
                this._enabledAttributes[index] = 1;
                GLDevice.gl.enableVertexAttribArray(index);
            }
        });
    }

    /**
     * set attribute pointer for current binding vertex buffer (bound by bindVertexBuffer() call)
     * @param attrib 
     * @param attribLocations 
     */
    public static setVertexAttribute(attrib: VertexBufferAttribute, attribLocations: Map<string, number>) {
        let index = attribLocations.get(attrib.name);
        if (index !== undefined) {
            index += attrib.locationOffset;
            this._newAttributes[index] = 1;
            if (this._enabledAttributes[index] === 0) {
                this._enabledAttributes[index] = 1;
            }
            GLDevice.gl.enableVertexAttribArray(index);
            GLDevice.gl.vertexAttribPointer(index, attrib.size, attrib.componentType, false, attrib.buffer.stride, attrib.offset);
            
            //if(this._attribDivisors[index] !== attrib.divisor) {
                GLDevice.gl.vertexAttribDivisor(index, attrib.divisor);
                this._attribDivisors[index] = attrib.divisor;
            //}
        }
    }

    public static disableUnusedAttributes() {
        // learned form three.js
        for (let i = 0; i < this._enabledAttributes.length; i++) {
            if(this._enabledAttributes[i] !== this._newAttributes[i]) {
                GLDevice.gl.disableVertexAttribArray(i);
                this._enabledAttributes[i] = 0;
            }
        }
    }
}
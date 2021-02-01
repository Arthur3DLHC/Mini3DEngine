import { GLDevice } from "./glDevice.js";
import { VertexBufferAttribute } from "./vertexBufferAttribute.js";

/**
 * OpenGL vertex buffer array object
 */
export class VertexBufferArray {

    public glArray: WebGLVertexArrayObject | null = null;

    private attributes: VertexBufferAttribute[] = [];

    // prepare
    public prepare(attributes: VertexBufferAttribute[]) {
        // check
        if (attributes.length === 0) {
            throw new Error("vertex attributes is empty");
        }
        
        const gl = GLDevice.gl;
        if (!this.glArray) {
            this.glArray = gl.createVertexArray();
        }

        this.attributes = attributes;

        // todo: bind vertex buffers and attribute pointers?
        gl.bindVertexArray(this.glArray);

        for (const attr of attributes) {
            
        }

        gl.bindVertexArray(null);
    }

    public release() {
        if (this.glArray) {
            GLDevice.gl.deleteVertexArray(this.glArray);
            this.glArray = null;
        }
    }
}
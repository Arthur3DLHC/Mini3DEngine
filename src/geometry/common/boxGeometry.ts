import { BufferGeometry } from "../bufferGeometry.js";
import { VertexBuffer } from "../../WebGLResources/vertexBuffer.js";
import { GLDevice } from "../../WebGLResources/glDevice.js";
import { IndexBuffer } from "../../WebGLResources/indexBuffer.js";
import { VertexBufferAttribute } from "../../WebGLResources/vertexBufferAttribute.js";

export class BoxGeometry extends BufferGeometry {
    /**
     * constructor
     * @param width length in x dimension
     * @param height length in y dimension
     * @param depth lengh in z dimension
     */
    public constructor(width: number, height: number, depth: number) {
        super();
        // todo: create vertex and index buffer
        // create vertex attributes
        // position, normal, texcoord?
        // fix me: tangent, binormal?
        this.vertexBuffer = new VertexBuffer(GLDevice.gl.STATIC_DRAW);
        this.indexBuffer = new IndexBuffer(GLDevice.gl.STATIC_DRAW);

        this.vertexBuffer.stride = 8 * 4;
        const x = width * 0.5;
        const y = height * 0.5;
        const z = depth * 0.5;
        this.vertexBuffer.data = new Float32Array([
            // -x plane, 4 points
            -x, -y, -z,     -1, 0, 0,   0, 0,
            -x,  y, -z,     -1, 0, 0,   0, 1,
            -x,  y,  z,     -1, 0, 0,   1, 1,
            -x, -y,  z,     -1, 0, 0,   1, 0,
            // -y plane, 4 points
            -x, -y,  z,     0, -1, 0,   0, 0,
             x, -y,  z,     0, -1, 0,   0, 1,
             x, -y, -z,     0, -1, 0,   1, 1,
            -x, -y, -z,     0, -1, 0,   1, 0,
            // -z plane, 4 points
             x, -y, -z,     0, 0, -1,   0, 0,
             x,  y, -z,     0, 0, -1,   0, 1,
            -x,  y, -z,     0, 0, -1,   1, 1,
            -x, -y, -z,     0, 0, -1,   1, 0,
            // x plane, 4 points
             x, -y,  z,     1, 0, 0,    0, 0,
             x,  y,  z,     1, 0, 0,    0, 1,
             x,  y, -z,     1, 0, 0,    1, 1,
             x, -y, -z,     1, 0, 0,    1, 0,
            // y plane, 4 points
            -x,  y, -z,     0, 1, 0,    0, 0,
             x,  y, -z,     0, 1, 0,    0, 1,
             x,  y,  z,     0, 1, 0,    1, 1,
            -x,  y,  z,     0, 1, 0,    1, 0,
            // z plane, 4 points
            -x, -y,  z,     0, 0, 1,    0, 0,
            -x,  y,  z,     0, 0, 1,    0, 1,
             x,  y,  z,     0, 0, 1,    1, 1,
             x, -y,  z,     0, 0, 1,    1, 0,
        ]);
        this.vertexBuffer.create();
        this.indexBuffer.indices = new Uint16Array([
            0, 1, 2, 2, 3, 0,
            4, 5, 6, 6, 7, 4,
            8, 9, 10, 10, 11, 8,
            12, 13, 14, 14, 15, 12,
            16, 17, 18, 18, 19, 16,
            20, 21, 22, 22, 23, 20,
        ]);
        this.indexBuffer.create();

        this._curOffset = 0;
        this.addAttribute("a_position", this.vertexBuffer, 3);
        this.addAttribute("a_normal", this.vertexBuffer, 3);
        this.addAttribute("a_texcoord0", this.vertexBuffer, 2);
    }

    private _curOffset: number = 0;

    private addAttribute(name: string, vertexBuffer: VertexBuffer, size: number) {
        this.attributes.push(new VertexBufferAttribute(name, vertexBuffer, size, this._curOffset));
        this._curOffset += size * 4;
    }
}
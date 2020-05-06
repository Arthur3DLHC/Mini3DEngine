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
        this.vertexBuffer.data = new Float32Array([
            // -x plane
            -width, -height, -depth, -1, 0, 0, 0, 0,
            // -y plane
            // -z plane
            // x plane
            // y plane
            // z plane
        ]);
        this.vertexBuffer.create();
        this.indexBuffer.indices = new Uint16Array([
            0, 1, 2, 2, 1, 3,
            // todo: all faces
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
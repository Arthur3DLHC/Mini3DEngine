import { BufferGeometry } from "../bufferGeometry.js";
import { VertexBuffer } from "../../WebGLResources/vertexBuffer.js";
import { GLDevice } from "../../WebGLResources/glDevice.js";
import { IndexBuffer } from "../../WebGLResources/indexBuffer.js";
import { Primitive } from "../primitive.js";
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
        this._width = Math.max(width, 0);
        this._height = Math.max(height, 0);
        this._depth = Math.max(depth, 0);

        const vertexBuffer = new VertexBuffer(GLDevice.gl.STATIC_DRAW)
        this.vertexBuffers.push(vertexBuffer);
        this.indexBuffer = new IndexBuffer(GLDevice.gl.STATIC_DRAW);

        vertexBuffer.stride = 8 * 4;
        const x = this._width * 0.5;
        const y = this._height * 0.5;
        const z = this._depth * 0.5;
        vertexBuffer.data = new Float32Array([
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
        vertexBuffer.create();
        this.indexBuffer.indices = new Uint16Array([
            1, 0, 2, 2, 0, 3,
            5, 4, 6, 6, 4, 7,
            9, 8, 10, 10, 8, 11,
            13, 12, 14, 14, 12, 15,
            17, 16, 18, 18, 16, 19,
            21, 20, 22, 22, 20, 23,
        ]);
        this.indexBuffer.create();

        let curOffset = 0;
        curOffset = this.addAttribute(VertexBufferAttribute.defaultNamePosition, vertexBuffer, 3, curOffset);
        curOffset = this.addAttribute(VertexBufferAttribute.defaultNameNormal, vertexBuffer, 3, curOffset);
        curOffset = this.addAttribute(VertexBufferAttribute.defaultNameTexcoord0, vertexBuffer, 2, curOffset);

        const grp = new Primitive();
        this.primitives.push(grp);

        this.computeBoundingSphere();
    }

    private _width: number;
    private _height: number;
    private _depth: number;

    public get width(): number {return this._width;}
    public get height(): number {return this._height;}
    public get depth(): number {return this._depth;}
}
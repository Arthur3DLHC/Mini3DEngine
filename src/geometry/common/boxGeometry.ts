import { BufferGeometry } from "../bufferGeometry.js";
import { VertexBuffer } from "../../WebGLResources/vertexBuffer.js";
import { GLDevice } from "../../WebGLResources/glDevice.js";
import { IndexBuffer } from "../../WebGLResources/indexBuffer.js";
import { PrimitiveGroup } from "../primitiveGroup.js";

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

        this.vertexBuffer = new VertexBuffer(GLDevice.gl.STATIC_DRAW);
        this.indexBuffer = new IndexBuffer(GLDevice.gl.STATIC_DRAW);

        this.vertexBuffer.stride = 8 * 4;
        const x = this._width * 0.5;
        const y = this._height * 0.5;
        const z = this._depth * 0.5;
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

        let curOffset = 0;
        curOffset = this.addAttribute("a_position", this.vertexBuffer, 3, curOffset);
        curOffset = this.addAttribute("a_normal", this.vertexBuffer, 3, curOffset);
        curOffset = this.addAttribute("a_texcoord0", this.vertexBuffer, 2, curOffset);

        const grp = new PrimitiveGroup();
        this.groups.push(grp);
    }

    private _width: number;
    private _height: number;
    private _depth: number;

    public get width(): number {return this._width;}
    public get height(): number {return this._height;}
    public get depth(): number {return this._depth;}
}
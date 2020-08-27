import { BufferGeometry } from "../bufferGeometry.js";
import { VertexBuffer } from "../../WebGLResources/vertexBuffer.js";
import { IndexBuffer } from "../../WebGLResources/indexBuffer.js";
import { GLDevice } from "../../WebGLResources/glDevice.js";
import { VertexBufferAttribute } from "../../WebGLResources/vertexBufferAttribute.js";
import { Primitive } from "../primitive.js";

/**
 * box wireframe, used to draw boundingbox etc.
 */
export class BoxWireframeGeometry extends BufferGeometry {
    public constructor(width: number, height: number, depth: number) {
        super();

        this._width = Math.max(width, 0);
        this._height = Math.max(height, 0);
        this._depth = Math.max(depth, 0);

        const vertexBuffer = new VertexBuffer(GLDevice.gl.STATIC_DRAW)
        this.vertexBuffers.push(vertexBuffer);
        this.indexBuffer = new IndexBuffer(GLDevice.gl.STATIC_DRAW);

        // only need positions
        vertexBuffer.stride = 3 * 4;
        const x = this._width * 0.5;
        const y = this._height * 0.5;
        const z = this._depth * 0.5;

        // only need 8 points
        vertexBuffer.data = new Float32Array([
            // -y plane, 4 points
            -x, -y,  z,
             x, -y,  z,
             x, -y, -z,
            -x, -y, -z,
            // y plane, 4 points
            -x,  y,  z,
             x,  y,  z,
             x,  y, -z,
            -x,  y, -z,
        ]);
        vertexBuffer.create();

        // 12 edges
        this.indexBuffer.indices = new Uint16Array([
            0, 1,
            1, 2,
            2, 3,
            3, 0,
            4, 5,
            5, 6,
            6, 7,
            7, 4,
            0, 4,
            1, 5,
            2, 6,
            3, 7,
        ]);
        this.indexBuffer.create();

        this.addAttribute(VertexBufferAttribute.defaultNamePosition, vertexBuffer, 3, GLDevice.gl.FLOAT, 0);

        const grp = new Primitive();
        this.primitives.push(grp);

        this.drawMode = GLDevice.gl.LINES;

        this.computeBounding();
    }

    private _width: number;
    private _height: number;
    private _depth: number;

    public get width(): number {return this._width;}
    public get height(): number {return this._height;}
    public get depth(): number {return this._depth;}
}
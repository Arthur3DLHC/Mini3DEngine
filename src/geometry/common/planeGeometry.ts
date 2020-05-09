import { BufferGeometry } from "../bufferGeometry.js";
import { VertexBuffer } from "../../WebGLResources/vertexBuffer.js";
import { GLDevice } from "../../WebGLResources/glDevice.js";
import { IndexBuffer, PrimitiveGroup } from "../../miniEngine.js";

export class PlaneGeometry extends BufferGeometry {
    public constructor(width: number, height: number, widthSegments: number, heightSegments: number) {
        super();
        this._width = Math.max(0, width);
        this._height = Math.max(0, height);
        this._widthSeg = Math.max(1, widthSegments);
        this._heightSeg = Math.max(1, heightSegments);

        this.vertexBuffer = new VertexBuffer(GLDevice.gl.STATIC_DRAW);
        this.indexBuffer = new IndexBuffer(GLDevice.gl.STATIC_DRAW);

        const floats = 8;

        this.vertexBuffer.stride = floats * 4;
        this.vertexBuffer.data = new Float32Array(floats * (this._widthSeg + 1) * (this._heightSeg + 1));

        const halfWidth = this._width * 0.5;
        const halfHeight = this._height * 0.5;

        for (let j = 0; j < this._heightSeg + 1; j++) {
            const t = j / this._heightSeg;
            const z = -halfHeight + t * this._height;
            for(let i = 0; i < this._widthSeg + 1; i++) {
                const s = i / this._widthSeg;
                const x = -halfWidth + s * this._width;
                const idx = (j * (this._widthSeg + 1) + i) * floats;
                this.vertexBuffer.data[idx + 0] = x;
                this.vertexBuffer.data[idx + 1] = 0;
                this.vertexBuffer.data[idx + 2] = z;
                this.vertexBuffer.data[idx + 3] = 0;
                this.vertexBuffer.data[idx + 4] = 1;
                this.vertexBuffer.data[idx + 5] = 0;
                this.vertexBuffer.data[idx + 6] = s;
                this.vertexBuffer.data[idx + 7] = t;
            }
        }
        this.vertexBuffer.create();
        const indices: number[] = [];
        // a   b
        // c   d
        for(let j = 0; j < this.heightSegments; j++) {
            for(let i = 0; i < this.widthSegments; i++) {
                let a = i + j * (this.widthSegments + 1);
                let b = a + 1;
                let c = a + (this.widthSegments + 1);
                let d = c + 1;
                indices.push(a);
                indices.push(c);
                indices.push(b);
                indices.push(b);
                indices.push(c);
                indices.push(d);
            }
        }
        this.indexBuffer.indices = new Uint16Array(indices);
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
    private _widthSeg: number;
    private _heightSeg: number;

    public get width(): number {return this._width;}
    public get height(): number {return this._height;}
    public get widthSegments(): number{return this._widthSeg;}
    public get heightSegments(): number{return this._heightSeg;}
}
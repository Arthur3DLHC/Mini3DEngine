import { BufferGeometry } from "../bufferGeometry.js";
import { VertexBuffer } from "../../WebGLResources/vertexBuffer.js";
import { IndexBuffer } from "../../WebGLResources/indexBuffer.js";
import { GLDevice } from "../../WebGLResources/glDevice.js";
import { PrimitiveGroup } from "../primitiveGroup.js";

export class SphereGeometry extends BufferGeometry {
    public constructor(radius: number, widthSegments: number, heightSegments: number) {
        super();

        this._radius = Math.max(radius, 0);
        this._widthSegments = Math.max(4, Math.floor(widthSegments));
        this._heightSegments = Math.max(2, Math.floor(heightSegments));

        this.vertexBuffer = new VertexBuffer(GLDevice.gl.STATIC_DRAW);
        this.indexBuffer = new IndexBuffer(GLDevice.gl.STATIC_DRAW);

        // floats per vertex
        const floatCount = 8;

        this.vertexBuffer.stride = floatCount * 4;
        this.vertexBuffer.data = new Float32Array(floatCount * (this._heightSegments + 1) * (this._widthSegments + 1));
        // todo: fill vertex data
        for (let j = 0; j < this._heightSegments + 1; j++) {
            const t = (j / this._heightSegments);
            const lat = t * Math.PI - Math.PI * 0.5;
            const y = this._radius * Math.sin(lat);
            const r1 = this._radius * Math.cos(lat);
            for (let i = 0; i < this._widthSegments + 1; i++) {
                const s = (i / this._widthSegments);
                const lon = s * Math.PI * 2;
                const z = r1 * Math.sin(lon);
                const x = r1 * Math.cos(lon);
                const idx = (j * (this._widthSegments + 1) + i) * floatCount;
                this.vertexBuffer.data[idx + 0] = x;
                this.vertexBuffer.data[idx + 1] = y;
                this.vertexBuffer.data[idx + 2] = z;
                this.vertexBuffer.data[idx + 3] = x / this._radius;
                this.vertexBuffer.data[idx + 4] = y / this._radius;
                this.vertexBuffer.data[idx + 5] = z / this._radius;
                this.vertexBuffer.data[idx + 6] = s;
                this.vertexBuffer.data[idx + 7] = t;
            }
        }

        this.vertexBuffer.create();

        // todo: fill index data
        // heightSegments rows,
        // every row has widthSegments * 2 triangles
        const indices: number[] = [];
        for (let j = 0; j < this._heightSegments; j++) {
            for (let i = 0; i < this._widthSegments; i++) {
                // d  c
                // b  a
                let a = i + j * (this._widthSegments + 1);
                let b = a + 1;
                let c = a + (this._widthSegments + 1);
                let d = c + 1;
                indices.push(b);
                indices.push(a);
                indices.push(d);
                indices.push(d);
                indices.push(a);
                indices.push(c);
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

    private _radius: number;
    private _widthSegments: number;
    private _heightSegments: number;

    public get radius(): number {return this._radius;}
    public get widthSegments(): number {return this._widthSegments;}
    public get heightSegments(): number {return this._heightSegments;}
}
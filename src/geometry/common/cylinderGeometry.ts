import { BufferGeometry } from "../bufferGeometry.js";
import { VertexBuffer } from "../../WebGLResources/vertexBuffer.js";
import { IndexBuffer } from "../../WebGLResources/indexBuffer.js";
import { GLDevice } from "../../WebGLResources/glDevice.js";
import { PrimitiveGroup } from "../primitiveGroup.js";

export class CylinderGeometry extends BufferGeometry {
    public constructor(radius: number, height: number, segments: number) {
        super();

        this._radius = Math.max(0, radius);
        this._height = Math.max(0, height);
        this._segments = Math.max(3, Math.floor(segments));

        this.vertexBuffer = new VertexBuffer(GLDevice.gl.STATIC_DRAW);
        this.indexBuffer = new IndexBuffer(GLDevice.gl.STATIC_DRAW);

        // floats per vertex
        const floatCount = 8;

        this.vertexBuffer.stride = floatCount * 4;
        this.vertexBuffer.data = new Float32Array(floatCount * ((this._segments + 1) * 4 + 2));
        // todo: fill vertex data
        // side
        const y = this._height * 0.5;
        for(let i = 0; i <= this._segments; i++) {
            const s = i / this._segments;
            const theta = s * Math.PI * 2;
            const x = this._radius * Math.cos(theta);
            const z = this._radius * Math.sin(theta);

            const topIdx = i * 2 * floatCount;
            const bottomIdx = (i * 2 + 1) * floatCount;
            const topCapIdx = floatCount * ((this._segments + 1) * 2 + i);
            const bottomCapIdx = floatCount * ((this._segments + 1) * 3 + i);

            // side
            this.addVertex(this.vertexBuffer.data, topIdx, x, y, z, x / this._radius, 0, z / this._radius, s, 1);
            this.addVertex(this.vertexBuffer.data, bottomIdx, x, -y, z, x / this._radius, 0, z / this._radius, s, 0);

            // top cap
            this.addVertex(this.vertexBuffer.data, topCapIdx, x, y, z, 0, 1, 0, s, 0);
            // bottom cap
            this.addVertex(this.vertexBuffer.data, bottomCapIdx, x, -y, z, 0, -1, 0, s, 0);
        }
        const topCenterPtIdx = floatCount * ((this._segments + 1) * 4 + 0);
        this.addVertex(this.vertexBuffer.data, topCenterPtIdx, 0, y, 0, 0, 1, 0, 0.5, 1);

        const bottomCenterPtIdx = floatCount * ((this._segments + 1) * 4 + 1);
        this.addVertex(this.vertexBuffer.data, bottomCenterPtIdx, 0, -y, 0, 0, -1, 0, 0.5, 1);

        this.vertexBuffer.create();

        // todo: fill index data
        const indices: number[] = [];
        // side
        for (let i = 0; i < this._segments * 2; i += 2) {
            // a c
            // b d
            const a = i;
            const b = i + 1;
            const c = i + 2;
            const d = i + 3;

            indices.push(a);
            indices.push(c);
            indices.push(b);
            indices.push(b);
            indices.push(c);
            indices.push(d);
        }
        // todo: top cap
        let c = (this._segments + 1) * 4 + 0;
        for (let i = 0; i < this._segments; i++) {
            const a = (this._segments + 1) * 2 + i;
            const b = a + 1;
            indices.push(a);
            indices.push(c);
            indices.push(b);
        }
        // todo: bottom cap
        c = (this._segments + 1) * 4 + 1;
        for (let i = 0; i < this._segments; i++) {
            const a = (this._segments + 1) * 3 + i;
            const b = a + 1;
            indices.push(a);
            indices.push(b);
            indices.push(c);
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
    private _height: number;
    private _segments: number;

    public get radius() {return this._radius;}
    public get height() {return this._height;}
    public get segments() {return this._segments;}

    private addVertex(data:Float32Array, startIdx: number, x: number, y: number, z: number, nx: number, ny: number, nz: number, s: number,t: number) {
        data[startIdx + 0] = x;
        data[startIdx + 1] = y;
        data[startIdx + 2] = z;
        data[startIdx + 3] = nx;
        data[startIdx + 4] = ny;
        data[startIdx + 5] = nz;
        data[startIdx + 6] = s;
        data[startIdx + 7] = t;
    }
}
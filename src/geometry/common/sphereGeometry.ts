import { BufferGeometry } from "../bufferGeometry.js";
import { VertexBuffer } from "../../WebGLResources/vertexBuffer.js";
import { IndexBuffer } from "../../WebGLResources/indexBuffer.js";
import { GLDevice } from "../../WebGLResources/glDevice.js";
import { Primitive } from "../primitive.js";
import { VertexBufferAttribute } from "../../WebGLResources/vertexBufferAttribute.js";
import vec3 from "../../../lib/tsm/vec3.js";

export class SphereGeometry extends BufferGeometry {
    public constructor(radius: number, widthSegments: number, heightSegments: number) {
        super();

        this._radius = Math.max(radius, 0);
        this._widthSegments = Math.max(4, Math.floor(widthSegments));
        this._heightSegments = Math.max(2, Math.floor(heightSegments));

        const vertexBuffer = new VertexBuffer(GLDevice.gl.STATIC_DRAW);
        this.vertexBuffers.push(vertexBuffer);
        this.indexBuffer = new IndexBuffer(GLDevice.gl.STATIC_DRAW);

        // floats per vertex
        const floatCount = 8;

        vertexBuffer.stride = floatCount * 4;
        vertexBuffer.data = new Float32Array(floatCount * (this._heightSegments + 1) * (this._widthSegments + 1));
        // fill vertex data
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
                vertexBuffer.data[idx + 0] = x;
                vertexBuffer.data[idx + 1] = y;
                vertexBuffer.data[idx + 2] = z;
                vertexBuffer.data[idx + 3] = x / this._radius;
                vertexBuffer.data[idx + 4] = y / this._radius;
                vertexBuffer.data[idx + 5] = z / this._radius;
                vertexBuffer.data[idx + 6] = s;
                vertexBuffer.data[idx + 7] = t;
            }
        }

        vertexBuffer.create();

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
        curOffset = this.addAttribute(VertexBufferAttribute.defaultNamePosition, vertexBuffer, 3, GLDevice.gl.FLOAT, curOffset);
        curOffset = this.addAttribute(VertexBufferAttribute.defaultNameNormal, vertexBuffer, 3, GLDevice.gl.FLOAT, curOffset);
        curOffset = this.addAttribute(VertexBufferAttribute.defaultNameTexcoord0, vertexBuffer, 2, GLDevice.gl.FLOAT, curOffset);

        const grp = new Primitive();
        this.primitives.push(grp);

        this.boundingSphere.radius = this._radius;
        this.boundingBox.minPoint = new vec3([-this._radius, -this._radius, -this._radius]);
        this.boundingBox.maxPoint = new vec3([this._radius, this._radius, this._radius]);
    }

    private _radius: number;
    private _widthSegments: number;
    private _heightSegments: number;

    public get radius(): number {return this._radius;}
    public get widthSegments(): number {return this._widthSegments;}
    public get heightSegments(): number {return this._heightSegments;}
}
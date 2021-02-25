import { BufferGeometry } from "../bufferGeometry.js";
import { VertexBuffer } from "../../WebGLResources/vertexBuffer.js";
import { IndexBuffer } from "../../WebGLResources/indexBuffer.js";
import { GLDevice } from "../../WebGLResources/glDevice.js";
import { Primitive } from "../primitive.js";
import { DefaultAttributeLocations, VertexBufferAttribute } from "../../WebGLResources/vertexBufferAttribute.js";

export class PlaneGeometry extends BufferGeometry {
    /**
     * 
     * @param width 
     * @param height 
     * @param widthSegments 
     * @param heightSegments 
     * @param normalAxis 0 - x, 1 - y, 2 - z
     */
    public constructor(width: number, height: number, widthSegments: number, heightSegments: number, normalAxis: number = 1) {
        super();
        this._width = Math.max(0, width);
        this._height = Math.max(0, height);
        this._widthSeg = Math.max(1, widthSegments);
        this._heightSeg = Math.max(1, heightSegments);

        const vertexBuffer = new VertexBuffer(GLDevice.gl.STATIC_DRAW);
        this.vertexBuffers.push(vertexBuffer);
        this.indexBuffer = new IndexBuffer(GLDevice.gl.STATIC_DRAW);

        const floats = 8;

        vertexBuffer.stride = floats * 4;
        vertexBuffer.data = new Float32Array(floats * (this._widthSeg + 1) * (this._heightSeg + 1));

        const halfWidth = this._width * 0.5;
        const halfHeight = this._height * 0.5;

        for (let j = 0; j < this._heightSeg + 1; j++) {
            const t = j / this._heightSeg;
            const v = -halfHeight + t * this._height;
            for(let i = 0; i < this._widthSeg + 1; i++) {
                const s = i / this._widthSeg;
                const u = -halfWidth + s * this._width;
                const idx = (j * (this._widthSeg + 1) + i) * floats;
                if (normalAxis === 0) {
                    vertexBuffer.data[idx + 0] = 0;
                    vertexBuffer.data[idx + 1] = -v;        // to face +x
                    vertexBuffer.data[idx + 2] = -u;
                } else if (normalAxis === 1) {
                    vertexBuffer.data[idx + 0] = u;
                    vertexBuffer.data[idx + 1] = 0;
                    vertexBuffer.data[idx + 2] = v;
                } else {
                    vertexBuffer.data[idx + 0] = u;
                    vertexBuffer.data[idx + 1] = -v;        // to face +z, for billboards
                    vertexBuffer.data[idx + 2] = 0;
                }

                vertexBuffer.data[idx + 3] = 0;
                vertexBuffer.data[idx + 4] = 1;
                vertexBuffer.data[idx + 5] = 0;
                vertexBuffer.data[idx + 6] = s;
                vertexBuffer.data[idx + 7] = t;
            }
        }
        vertexBuffer.create();
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
        curOffset = this.addAttribute(VertexBufferAttribute.defaultNamePosition, DefaultAttributeLocations[VertexBufferAttribute.defaultNamePosition], vertexBuffer, 3, GLDevice.gl.FLOAT, curOffset);
        curOffset = this.addAttribute(VertexBufferAttribute.defaultNameNormal, DefaultAttributeLocations[VertexBufferAttribute.defaultNameNormal], vertexBuffer, 3, GLDevice.gl.FLOAT, curOffset);
        curOffset = this.addAttribute(VertexBufferAttribute.defaultNameTexcoord0, DefaultAttributeLocations[VertexBufferAttribute.defaultNameTexcoord0], vertexBuffer, 2, GLDevice.gl.FLOAT, curOffset);

        const grp = new Primitive();
        this.primitives.push(grp);

        this.computeBounding();
       
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
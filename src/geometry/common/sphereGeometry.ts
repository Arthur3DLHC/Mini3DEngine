import { BufferGeometry } from "../bufferGeometry.js";
import { VertexBuffer } from "../../WebGLResources/vertexBuffer.js";
import { IndexBuffer } from "../../WebGLResources/indexBuffer.js";
import { GLDevice } from "../../WebGLResources/glDevice.js";
import { PrimitiveGroup } from "../primitiveGroup.js";

export class SphereGeometry extends BufferGeometry {
    public constructor(radius: number, widthSegments: number, heightSegments: number) {
        super();

        this._radius = Math.max(radius, 0);
        this._widthSegments = Math.max(4, widthSegments);
        this._heightSegments = Math.max(2, heightSegments);

        this.vertexBuffer = new VertexBuffer(GLDevice.gl.STATIC_DRAW);
        this.indexBuffer = new IndexBuffer(GLDevice.gl.STATIC_DRAW);

        this.vertexBuffer.stride = 8 * 4;
        // todo: fill vertex data
        this.vertexBuffer.create();

        // todo: fill index data
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
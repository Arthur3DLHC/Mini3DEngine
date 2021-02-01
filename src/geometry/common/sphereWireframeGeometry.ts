import { BufferGeometry } from "../bufferGeometry.js";
import { VertexBuffer } from "../../WebGLResources/vertexBuffer.js";
import { GLDevice } from "../../WebGLResources/glDevice.js";
import { IndexBuffer } from "../../WebGLResources/indexBuffer.js";
import vec3 from "../../../lib/tsm/vec3.js";
import { DefaultAttributeLocations, VertexBufferAttribute } from "../../WebGLResources/vertexBufferAttribute.js";
import { Primitive } from "../primitive.js";
import mat4 from "../../../lib/tsm/mat4.js";
import vec4 from "../../../lib/tsm/vec4.js";

/**
 * simplified sphere wireframe, for draw bounding spheres etc.
 */
export class SphereWireframeGeometry extends BufferGeometry {
    public constructor(radius: number, segments: number) {
        super();

        this._radius = Math.max(radius, 0);
        this._segments = Math.max(3, segments);

        const vertexBuffer = new VertexBuffer(GLDevice.gl.STATIC_DRAW);
        this.vertexBuffers.push(vertexBuffer);
        this.indexBuffer = new IndexBuffer(GLDevice.gl.STATIC_DRAW);

        // floats per vertex
        const floatCount = 3;

        vertexBuffer.stride = floatCount * 4;
        // 3 rings, in x y z plane
        vertexBuffer.data = new Float32Array(floatCount * (this.segments + 1) * 3);

        // fill vertex data for every ring
        // fix me: use different vertex color for 3 axis?
        this.fillRing(new vec3([1, 0, 0]), new vec3([0, 1, 0]), 0, floatCount, vertexBuffer.data);
        this.fillRing(new vec3([0, 1, 0]), new vec3([0, 0, 1]), 1, floatCount, vertexBuffer.data);
        this.fillRing(new vec3([0, 0, 1]), new vec3([1, 0, 0]), 2, floatCount, vertexBuffer.data);

        vertexBuffer.create();

        // todo: fill index data, 3 rings
        const indices: number[] = [];
        for (let ring = 0; ring < 3; ring++) {
            const startIdx = ring * (this.segments + 1);
            for (let i = 0; i < this.segments; i++) {
                // 2 points for one line segment
                indices.push(startIdx + i);
                indices.push(startIdx + i + 1);
            }
        }
        this.indexBuffer.indices = new Uint16Array(indices);
        this.indexBuffer.create();

        // vertex buffer attribute
        this.addAttribute(VertexBufferAttribute.defaultNamePosition, DefaultAttributeLocations[VertexBufferAttribute.defaultNamePosition], vertexBuffer, 3, GLDevice.gl.FLOAT, 0);

        const grp = new Primitive();
        this.primitives.push(grp);
        
        this.drawMode = GLDevice.gl.LINES;

        this.boundingSphere.radius = this._radius;
    }

    private _radius: number;
    private _segments: number;

    public get radius(): number {return this._radius;}
    public get segments(): number {return this._segments;}

    private fillRing(axis: vec3, startVec: vec3, ring: number, vertFloatSize: number, data: Float32Array) {
        const matRot: mat4 = new mat4();
        startVec.scale(this._radius);
        const tmpVec = new vec3();

        const ringStartIdx = ring * (this._segments + 1) * vertFloatSize;

        for (let i = 0; i <= this.segments; i++) {
            const phi = (i / this.segments) * Math.PI * 2.0;
            matRot.fromRotation(phi, axis);
            matRot.multiplyVec3(startVec, tmpVec);

            data[ringStartIdx + i * vertFloatSize] = tmpVec.x;
            data[ringStartIdx + i * vertFloatSize + 1] = tmpVec.y;
            data[ringStartIdx + i * vertFloatSize + 2] = tmpVec.z;
        }
    }
}
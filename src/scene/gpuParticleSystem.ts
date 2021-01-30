import { BufferGeometry } from "../geometry/bufferGeometry.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { VertexBuffer } from "../WebGLResources/vertexBuffer.js";
import { VertexBufferAttribute } from "../WebGLResources/vertexBufferAttribute.js";
import { Object3D } from "./object3D.js";

/**
 * the GPU accelerated particle system
 * can be sprites or geometries
 * uses transform feedback to update particle positions,
 * and instancing to render them.
 */
export class GPUParticleSystem extends Object3D {
    public constructor(maxParticleCount: number) {
        super();

        // todo: create vertex buffers
        // this._vertexBuffer = new VertexBuffer(GLDevice.gl.DYNAMIC_DRAW);

        // fix me: format?
    }

    public destroy() {
        const gl = GLDevice.gl;
        for (const vb of this._vertexBuffers) {
            gl.deleteBuffer(vb);
        }
        this._vertexBuffers.length = 0;
    }

    public geometry: BufferGeometry | null = null;

    private _vertexBuffers: VertexBuffer[] = [];
    private _attributes: VertexBufferAttribute[] = [];

    // todo: use VAOs?

    // fix me: how to present material and shader program?

    // todo: psys properties
}
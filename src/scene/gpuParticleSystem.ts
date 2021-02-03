import { BufferGeometry } from "../geometry/bufferGeometry.js";
import { RenderList } from "../renderer/renderList.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { VertexBuffer } from "../WebGLResources/vertexBuffer.js";
import { VertexBufferArray } from "../WebGLResources/VertexBufferArray.js";
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
        // use interleaved vertex buffers?

        const data: number[] = [];

        for (let i = 0; i < maxParticleCount; i++) {
            // position
            // direction or [billboard rotation angle, rotate speed]?
            // sideDirection
            // age
            // life
            // seed
            // size
            // color
            // frameIndex: texture animation frame index
            // noiseTexcoord
        }
        
        const gl = GLDevice.gl;

        // todo: create vertex buffers
        // can use STATIC_DRAW (in babylon.js)
        // this._vertexBuffer = new VertexBuffer(GLDevice.gl.DYNAMIC_DRAW);
        this._vertexBuffers.push(new VertexBuffer(gl.STATIC_DRAW));
        this._vertexBuffers.push(new VertexBuffer(gl.STATIC_DRAW));
    }

    public destroy() {
        const gl = GLDevice.gl;
        for (const vb of this._vertexBuffers) {
            gl.deleteBuffer(vb);
        }
        this._vertexBuffers.length = 0;
    }

    public geometry: BufferGeometry | null = null;

    /** read and write vertex buffer */
    private _vertexBuffers: VertexBuffer[] = [];
    /** vertex attributes for read and write vertex buffers */
    private _attributes: VertexBufferAttribute[][] = [];

    // todo: use VAOs?
    // ref:
    // https://gpfault.net/posts/webgl2-particles.txt.html
    // https://github.com/WebGLSamples/WebGL2Samples/blob/master/samples/transform_feedback_instanced.html
    // https://github.com/BabylonJS/Babylon.js/blob/master/src/Particles/gpuParticleSystem.ts

    // use 4 VAOs, 2 for update, 2 for render
    private _updateVAO: VertexBufferArray[] = [];
    private _renderVAO: VertexBufferArray[] = [];

    // fix me: how to present material and shader program?

    // update shader program (if null, use default?)
    // render shader program (if null, use default?)
    // uniform buffer?

    // textures? support texture animation frames?

    // todo: psys properties

    // isBillboard?
    // has texture animation?

    // note: when update, use buffer A as source,
    // and also use buffer A as source when render;
    // this will prevent waiting for the transform feedback finished
    // after render, swap the buffer B as source buffer.
    public update() {

    }

    public render() {
        
    }

    public provideRenderItem(renderList: RenderList) {

    }
}
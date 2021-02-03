import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";
import { BufferGeometry } from "../geometry/bufferGeometry.js";
import { RenderList } from "../renderer/renderList.js";
import { RenderStateSet } from "../renderer/renderStateSet.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { ShaderProgram } from "../WebGLResources/shaderProgram.js";
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
        this._maxParticleCount = maxParticleCount;
    }

    //#region public properties

    public geometry: BufferGeometry | null = null;

    
    // fix me: how to present material and shader program?

    public renderStateSet: RenderStateSet | null = null;

    /** update shader program (if null, will use a default one) */
    public updateProgram: ShaderProgram | null = null;

    /** render shader program (if null, will use a default one) */
    public renderProgram: ShaderProgram | null = null;

    // uniform values for custom shader program?
    // fix me: how to call different api for different data types?
    // or use a uniformBuffer object?

    // textures? support texture animation frames?

    // todo: general psys properties
    public emitRate: number = 10;

    // emitter range?
    // emit direction?

    public isBillboard: boolean = true;
    /** limit billbard rotation along particle direction axis */
    public limitBillboardRotation: boolean = false;

    /** has framed animation in texture? */
    public hasTextureAnimation: boolean = false;

    // todo: animation frames?
    // use one-row texture?
    public texAnimFrameCount: number = 1;
    public randomAnimStartFrame: boolean = false;

    public minLife: number = 1;
    public maxLife: number = 1;

    public minSize: vec3 = new vec3([1,1,1]);
    public maxSize: vec3 = new vec3([1,1,1]);

    /** emit color */
    public color: vec4 = new vec4([1,1,1,1]);

    // todo: noise texture?

    /** particles collide with scene depth texture? */
    public collision: boolean = false;

    //#endregion

    //#region private fields

    private _maxParticleCount: number = 0;
    /**
     * increase every frame by emit rate;
     * then controls how many instances are rendered when drawElementsInstanced
     */
    private _curParticleCount: number = 0;

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

    private static _defaultUpdateProgram: ShaderProgram | null = null;
    private static _defaultRenderProgram: ShaderProgram | null = null;
    private static _defaultRenderStates: RenderStateSet | null = null;

    //#endregion


    //#region public methods

    public static initDefaultMaterial() {

    }

    public static releaseDefaultMaterial() {

    }
    
    public rebuild() {
        this.destroy();

        // todo: control data contents, vertex attribs by psys flags

        const data: number[] = [];

        for (let i = 0; i < this._maxParticleCount; i++) {
            // position: vec3
            data.push(0, 0, 0);
            // direction: vec3 or [billboard rotation angle, rotate speed]?
            data.push(0, 0, 0);
            // upDirection: vec3    // current up dir
            data.push(0, 1, 0);
            // age: number
            data.push(0);   // use a dead particle; emit in update shader
            // life: number // life for every particle is different; generated randomly from life range.
            data.push(0);   // zero indicates this is a dead particle
            // seed: vec4
            data.push(Math.random(), Math.random(), Math.random(), Math.random());
            // size: vec3
            data.push(1, 1, 1);
            // color: vec4
            data.push(1, 1, 1, 1);
            // frameIndex: number // texture animation frame index
            data.push(0);
            // noiseTexcoord
            data.push(0, 0);
        }
        
        const gl = GLDevice.gl;

        // todo: create vertex buffers
        // can use STATIC_DRAW (according to babylon.js)
        // this._vertexBuffer = new VertexBuffer(GLDevice.gl.DYNAMIC_DRAW);
        this._vertexBuffers.push(new VertexBuffer(gl.STATIC_DRAW));
        this._vertexBuffers.push(new VertexBuffer(gl.STATIC_DRAW));

        // attributes
        this._attributes.push([]);
        this._attributes.push([]);

        // VAOs
        // update VAO: only contains particle instance buffer

        // render VAO: contains geometry and instance buffer
    }

    public destroy() {
        const gl = GLDevice.gl;
        for (const vao of this._updateVAO) {
            vao.release();
        }
        for (const vao of this._renderVAO) {
            vao.release();
        }
        this._updateVAO.length = 0;
        this._renderVAO.length = 0;

        for (const vb of this._vertexBuffers) {
            vb.release();
        }
        this._vertexBuffers.length = 0;
    }

    /**
     * start emitting
     */
    public start() {

    }

    /**
     * stop emitting
     */
    public stop() {

    }

    /**
     * kill all existing particles?
     */
    public reset() {

    }

    // todo: prewarm?
    // set a prewarm flag for entire rendering loop?

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

    //#endregion
}
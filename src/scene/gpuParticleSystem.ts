import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";
import { BufferGeometry } from "../geometry/bufferGeometry.js";
import { ClusteredForwardRenderContext } from "../renderer/clusteredForwardRenderContext.js";
import { RenderList } from "../renderer/renderList.js";
import { RenderStateSet } from "../renderer/renderStateSet.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { ShaderProgram } from "../WebGLResources/shaderProgram.js";
import { TransformFeedback } from "../WebGLResources/transformFeedback.js";
import { VertexBuffer } from "../WebGLResources/vertexBuffer.js";
import { VertexBufferArray } from "../WebGLResources/VertexBufferArray.js";
import { VertexBufferAttribute } from "../WebGLResources/vertexBufferAttribute.js";
import { VertexBufferAttributeSet } from "../WebGLResources/vertexBufferAttributeSet.js";
import { Clock } from "./clock.js";
import { GPUParticleMaterial } from "./materials/gpuParticleMaterial.js";
import { Object3D } from "./object3D.js";

export enum EmitterShape {
    Sphere,
    Box,
}

/**
 * default attributes of the update instance vertex buffer
 * note: need to skip geometry attribute locations when creating the render VAO!
 */
export const DefaultParticleAttributes = {
    POSITION: 0,
    DIRECTION: 1,
    UPDIR: 2,
    AGE_LIFE: 3,
    SEED: 4,
    SIZE: 5,
    COLOR: 6,
    FRAME_INDEX: 7,
    NOISE_TEXCOORD: 8
};

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
    public material: GPUParticleMaterial | null = null;
    public static defaultMaterial: GPUParticleMaterial | null = null;

    // public renderStateSet: RenderStateSet | null = null;

    // /** update shader program (if null, will use a default one) */
    // public updateProgram: ShaderProgram | null = null;

    // /** render shader program (if null, will use a default one) */
    // public renderProgram: ShaderProgram | null = null;

    // uniform values for custom shader program?
    // fix me: how to call different api for different data types?
    // or use a uniformBuffer object?

    // textures? support texture animation frames?

    // todo: general psys properties
    public emitRate: number = 10;

    // emitter shape and range?
    // different shape use different shaders?
    // or allow a few simple shapes, and use if branch in shader?
    public emitterShape: EmitterShape = EmitterShape.Sphere;

    public emitterSize: vec3 = new vec3([1,1,1]);

    public emitDirection: vec3 = new vec3([0, 1, 0]);

    public emitDirectionVariation: number = 0;


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
    
    // init speed?
    public minSpeed: number = 1;
    public maxSpeed: number = 1;

    public minSize: vec3 = new vec3([1,1,1]);
    public maxSize: vec3 = new vec3([1,1,1]);

    /** emit color */
    public startColor: vec4 = new vec4([1,1,1,1]);

    // todo: gradient color? generate a color gradient texture?
    public endColor: vec4 = new vec4([1,1,1,1]);

    // todo: noise texture?

    /** particles collide with scene depth texture? */
    public collision: boolean = false;

    public gravity: vec3 = new vec3();

    //#endregion

    //#region private fields

    private _maxParticleCount: number = 0;
    /**
     * increase every frame by emit rate;
     * will not subtract newly dead particles.
     * this is only to control how many instances are updated and rendered when drawElementsInstanced
     */
    private _curParticleCount: number = 0;

    /** will be passed in shader to control emitting */
    private _isEmitting = false;

    /** read and write vertex buffer */
    private _vertexBuffers: VertexBuffer[] = [];
    /** vertex attributes for read and write vertex buffers */
    private _updateAttributes: VertexBufferAttribute[][] = [];

    // todo: use VAOs?
    // ref:
    // https://gpfault.net/posts/webgl2-particles.txt.html
    // https://github.com/WebGLSamples/WebGL2Samples/blob/master/samples/transform_feedback_instanced.html
    // https://github.com/BabylonJS/Babylon.js/blob/master/src/Particles/gpuParticleSystem.ts

    // use 4 VAOs, 2 for update, 2 for render
    private _updateVAO: VertexBufferArray[] = [];
    private _renderVAO: VertexBufferArray[] = [];

    private _curSourceIndex: number = 0;

    // transform feedback object?
    // encapsulate or use gl object directly?
    private _transformFeedbacks: TransformFeedback[] = [];

    // private static _defaultUpdateProgram: ShaderProgram | null = null;
    // private static _defaultRenderProgram: ShaderProgram | null = null;
    // private static _defaultRenderStates: RenderStateSet | null = null;

    //#endregion


    //#region public methods

    public static initDefaultMaterial(renderContext: ClusteredForwardRenderContext) {
        if (GPUParticleSystem.defaultMaterial === null) {
            GPUParticleSystem.defaultMaterial = new GPUParticleMaterial(renderContext);
        }
    }

    public static releaseDefaultMaterial() {
        if (GPUParticleSystem.defaultMaterial !== null) {
            GPUParticleSystem.defaultMaterial.destroy();
            GPUParticleSystem.defaultMaterial = null;
        }
    }
    
    public rebuild() {
        this.destroy();

        // check geomery
        if (this.geometry === null) {
            return;
        }

        // todo: control data contents, vertex attribs by psys flags

        const data: number[] = [];

        for (let i = 0; i < this._maxParticleCount; i++) {
            // position: vec3
            data.push(0, 0, 0);
            // direction: vec3 or [billboard rotation angle, rotate speed]?
            // direciton is also velocity?
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
        const floatData = new Float32Array(data);

        for(let i = 0; i < 2; i++) {
            const vb = new VertexBuffer(gl.STATIC_DRAW);
            this._vertexBuffers.push(vb);

            vb.data = floatData;
            vb.create();

            const updateAttribSet = new VertexBufferAttributeSet();

            // set divisor to 0 (per vertex) when update
            updateAttribSet.addAttribute("p_position", DefaultParticleAttributes.POSITION, vb, 3, gl.FLOAT, 0);
            updateAttribSet.addAttribute("p_direction", DefaultParticleAttributes.DIRECTION, vb, 3, gl.FLOAT, 0);
            updateAttribSet.addAttribute("p_upDir", DefaultParticleAttributes.UPDIR, vb, 3, gl.FLOAT, 0);
            // put age and life in one vec2?
            updateAttribSet.addAttribute("p_ageLife", DefaultParticleAttributes.AGE_LIFE, vb, 2, gl.FLOAT, 0);
            updateAttribSet.addAttribute("p_seed", DefaultParticleAttributes.SEED, vb, 4, gl.FLOAT, 0);
            updateAttribSet.addAttribute("p_size", DefaultParticleAttributes.SIZE, vb, 3, gl.FLOAT, 0);
            updateAttribSet.addAttribute("p_color", DefaultParticleAttributes.COLOR, vb, 4, gl.FLOAT, 0);
            updateAttribSet.addAttribute("p_frameIdx", DefaultParticleAttributes.FRAME_INDEX, vb, 1, gl.FLOAT, 0);
            updateAttribSet.addAttribute("p_noiseTexCoord", DefaultParticleAttributes.NOISE_TEXCOORD, vb, 2, gl.FLOAT, 0);

            this._updateAttributes.push(updateAttribSet.attributes);

            const updateVAO = new VertexBufferArray();
            this._updateVAO.push(updateVAO);

        // update VAO: only contains particle instance buffer
            updateVAO.prepare(updateAttribSet.attributes, null);
        }

        // render VAO: contains geometry and instance buffer

        // swap update vbs
        const renderVB: VertexBuffer[] = [this._vertexBuffers[1], this._vertexBuffers[0]];

        for(let i = 0; i < 2; i++) {
            const vb = renderVB[i];
            const renderAttribSet = new VertexBufferAttributeSet();
            
            // use a fix location offset; easy to fit with shader
            let locationOffset = 8;
            // add geometry vertex attributes first
            for (const geomAttr of this.geometry.attributes) {
                renderAttribSet.addAttribute(geomAttr.name, geomAttr.location, geomAttr.buffer, geomAttr.size, geomAttr.componentType, 0);
                // locationOffset = Math.max(locationOffset, geomAttr.location);
            }

            // then add particle instance attributes with offseted location

            // set divisor to 1 (per instance)
            renderAttribSet.addAttribute("p_position", DefaultParticleAttributes.POSITION + locationOffset, vb, 3, gl.FLOAT, 1);
            renderAttribSet.addAttribute("p_direction", DefaultParticleAttributes.DIRECTION + locationOffset, vb, 3, gl.FLOAT, 1);
            renderAttribSet.addAttribute("p_upDir", DefaultParticleAttributes.UPDIR + locationOffset, vb, 3, gl.FLOAT, 1);
            // put age and life in one vec2?
            renderAttribSet.addAttribute("p_ageLife", DefaultParticleAttributes.AGE_LIFE + locationOffset, vb, 2, gl.FLOAT, 1);
            renderAttribSet.addAttribute("p_seed", DefaultParticleAttributes.SEED + locationOffset, vb, 4, gl.FLOAT, 1);
            renderAttribSet.addAttribute("p_size", DefaultParticleAttributes.SIZE + locationOffset, vb, 3, gl.FLOAT, 1);
            renderAttribSet.addAttribute("p_color", DefaultParticleAttributes.COLOR + locationOffset, vb, 4, gl.FLOAT, 1);
            renderAttribSet.addAttribute("p_frameIdx", DefaultParticleAttributes.FRAME_INDEX + locationOffset, vb, 1, gl.FLOAT, 1);
            renderAttribSet.addAttribute("p_noiseTexCoord", DefaultParticleAttributes.NOISE_TEXCOORD + locationOffset, vb, 2, gl.FLOAT, 1);

            const renderVAO = new VertexBufferArray();
            this._renderVAO.push(renderVAO);

            // pass in geometry index buffer
            renderVAO.prepare(renderAttribSet.attributes, this.geometry.indexBuffer);
        }

        // create transform feedback and record output buffer
        const feedback1 = new TransformFeedback();
        const feedback2 = new TransformFeedback();

        feedback1.outputBuffer = this._vertexBuffers[1];
        feedback2.outputBuffer = this._vertexBuffers[0];

        feedback1.prepare();
        feedback2.prepare();

        this._transformFeedbacks.push(feedback1, feedback2);
    }

    public destroy() {
        this._isEmitting = false;
        
        for (const feedback of this._transformFeedbacks) {
            feedback.release();
        }
        this._transformFeedbacks.length = 0;

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

        this._updateAttributes.length = 0;

    }

    /**
     * start emitting
     */
    public start() {
        this._isEmitting = true;
    }

    /**
     * stop emitting
     */
    public stop() {
        this._isEmitting = false;
    }

    /**
     * kill all existing particles?
     */
    public reset() {
        this._curParticleCount = 0;
        this._isEmitting = false;

        // fix me: need to reset particle vertex data?
    }

    // todo: prewarm?
    // set a prewarm flag for entire rendering loop?

    // note: when update, use buffer A as source,
    // and also use buffer A as source when render;
    // this will prevent waiting for the transform feedback finished
    // after render, swap the buffer B as source buffer.
    public update() {
        // curr particle count
        // note: need to use float value
        if(this._isEmitting) {
            this._curParticleCount += Clock.instance.elapsedTime * this.emitRate;
        }
        this._curParticleCount = Math.min(this._curParticleCount, this._maxParticleCount);
        const updateCount = Math.floor(this._curParticleCount);
        if (updateCount > 0) {

            // bind update VAO
            // bind transform feedback object
            // bind transfrom feedback buffer
            // attrib divisor
            // turn off rasterization

            // use update program

            // begin transform feedback
            // draw updateCount vertices
            // end transform feedback

            // turn on rasterization
            // bind VAO and transform buffers to null

            // pingpong the buffers
            this._curSourceIndex++;
            if (this._curSourceIndex >= 2) {
                this._curSourceIndex = 0;
            }
        }
    }

    public render() {
        const drawCount = Math.floor(this._curParticleCount);
        if (drawCount > 0) {
            // set material render states

            // use render program

            // uniforms

            // textures

            // bind render VAO

            // drawinstanced

            // restore render VAO?
        }
    }

    public provideRenderItem(renderList: RenderList) {

    }

    //#endregion
}
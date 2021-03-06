import mat4 from "../../lib/tsm/mat4.js";
import vec3 from "../../lib/tsm/vec3.js";
import vec4 from "../../lib/tsm/vec4.js";
import { BufferGeometry } from "../geometry/bufferGeometry.js";
import { BoundingSphere } from "../math/boundingSphere.js";
import { ClusteredForwardRenderContext } from "../renderer/clusteredForwardRenderContext.js";
import { RenderList } from "../renderer/renderList.js";
import { SceneTextureUnits } from "../renderer/sceneTextureUnits.js";
import { Gradient, GradientHelper } from "../utils/gradientsGeneric.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { GLGeometryBuffers } from "../WebGLResources/glGeometryBuffers.js";
import { GLPrograms } from "../WebGLResources/glPrograms.js";
import { GLRenderStates } from "../WebGLResources/glRenderStates.js";
import { GLTextures } from "../WebGLResources/glTextures.js";
import { GLTransformFeedbacks } from "../WebGLResources/glTransformFeedbacks.js";
import { SamplerState } from "../WebGLResources/renderStates/samplerState.js";
import { Texture2D } from "../WebGLResources/textures/texture2D.js";
import { TransformFeedback } from "../WebGLResources/transformFeedback.js";
import { VertexBuffer } from "../WebGLResources/vertexBuffer.js";
import { VertexBufferArray } from "../WebGLResources/VertexBufferArray.js";
import { VertexBufferAttribute } from "../WebGLResources/vertexBufferAttribute.js";
import { VertexBufferAttributeSet } from "../WebGLResources/vertexBufferAttributeSet.js";
import { Clock } from "./clock.js";
import { GPUParticleMaterial } from "./materials/gpuParticleMaterial.js";
import { Object3D } from "./object3D.js";

export enum EmitterShape {
    Ellipsoid,
    Box,
}

export enum RotationLimitMode {
    NoLimit = 0,
    Axis = 1,
    /** if is billboard, will align y axis to move dir */
    MoveDir = 2
}

/**
 * default attributes of the update instance vertex buffer
 * note: need to skip geometry attribute locations when creating the render VAO!
 */
export const DefaultParticleAttributes = {
    POSITION: 0,
    DIRECTION: 1,
    AGE_LIFE: 2,
    SEED: 3,
    SIZE: 4,
    COLOR: 5,
    FRAME_INDEX: 6,
    ANGLE_ROTSPEED: 7,
    // NOISE_TEXCOORD: 8,
};

/**
 * the GPU accelerated particle system
 * can be sprites or geometries
 * uses transform feedback to update particle positions,
 * and instancing to render them.
 * this is a simplified version of BabylonJS gpuParticleSystem
 * see https://github.com/BabylonJS/Babylon.js/blob/master/src/Particles/gpuParticleSystem.ts
 * more references:
 * (transform feedback with geometry shader)
 * https://wiki.jikexueyuan.com/project/modern-opengl-tutorial/tutorial28.html
 * http://ogldev.atspace.co.uk/www/tutorial28/tutorial28.html
 */
export class GPUParticleSystem extends Object3D {
    public constructor(maxParticleCount: number) {
        super();
        this._maxParticleCount = maxParticleCount;
    }

    //#region public properties

    /** generally, should use a plane geometry with normal towards z axis */
    public geometry: BufferGeometry | null = null;

    // fix me: how to present material and shader program?
    /** note: multiple psys object can share same material. so materials need to be released manually */
    public material: GPUParticleMaterial | null = null;
    public static defaultMaterial: GPUParticleMaterial | null = null;

    /** max visible distance */
    public visibleDistance: number = 20;

    /** approximate bounding sphere */
    public get boundingSphere(): BoundingSphere {
        return this._boundingSphere;
    }

    // general psys properties
    /**
     * if oneShot == false, this is the number of particles emitted per second.
     * if oneShot == true, this is the number of particles emitted for one time.
     */
    public emitRate: number = 10;

    /** if true, the n particles will emit at same time when calling start() and only emit one time. n = emitRate */
    public oneShot: boolean = false;

    // emitter shape and range?
    // different shape use different shaders?
    // or allow a few simple shapes, and use if branch in shader?
    public emitterShape: EmitterShape = EmitterShape.Ellipsoid;

    public emitterSize: vec3 = new vec3([1,1,1]);

    public emitDirection: vec3 = new vec3([0, 1, 0]);

    public emitDirectionVariation: number = 0;


    public isBillboard: boolean = true;
    /** limit billbard rotation along particle direction axis */
    // public limitBillboardRotation: boolean = false;

    public rotationLimit: RotationLimitMode = RotationLimitMode.NoLimit;

    /** rotation limit axis in object local space */
    public rotationLimitAxis: vec3 = new vec3([0, 1, 0]);

    /** has framed animation in texture? */
    public hasTextureAnimation: boolean = false;

    /** soft particle. only affect when transparent. */
    public softParticle: boolean = true;

    // texture animations
    // use one-row texture
    // can use only part of all frames.
    public texAnimStartFrame: number = 0;
    public texAnimEndFrame: number = 0;
    public texAnimFrameIncreaseSpeed: number = 0;


    public randomAnimStartFrame: boolean = false;

    public minLife: number = 1;
    public maxLife: number = 1;
    
    // init speed?
    public minSpeed: number = 1;
    public maxSpeed: number = 1;

    public minAngle: number = 0;
    public maxAngle: number = 0;

    public minAngularSpeed: number = 0;
    public maxAngularSpeed: number = 0;

    public minSize: vec3 = new vec3([1,1,1]);
    public maxSize: vec3 = new vec3([1,1,1]);

    /** emit color */
    public color1: vec4 = new vec4([1,1,1,1]);
    public color2: vec4 = new vec4([1,1,1,1]);

    // todo: gradient color? generate a color gradient texture?
    /**
     * color gradients. will mutiply with particle color.
     * note: don't use push and other methods to modify the gradient array.
     * use a new array to replace the entire old gradients.
     */
    public get colorGradients(): Gradient<vec4>[] | null { return this._colorGradients; }

    /**
     * replace entire color gradients array.
     */
    public set colorGradients(gradients: Gradient<vec4>[] | null) {
        this._colorGradients = gradients;

        if (this._colorGradients !== null) {
            this._colorGradients.sort((a, b) => {
                return a.gradient - b.gradient;
            });
        }

        this._colorGradientTextureDirty = true;
    }

    /**
     * size gradients. will multiply with particle size.
     * note: don't use push and other methods to modify the gradient array.
     * use a new array to replace the entire old gradients.
     */
    public get sizeGradients(): Gradient<vec3>[] | null { return this._sizeGradients; }

    /**
     * replace entire size gradients array.
     */
    public set sizeGradients(gradients: Gradient<vec3>[] | null) {
        this._sizeGradients = gradients;

        if (this._sizeGradients !== null) {
            this._sizeGradients.sort((a, b) => {
                return a.gradient - b.gradient;
            });
        }

        this._sizeGradientTextureDirty = true;
    }

    // todo: noise texture?

    /** particles collide with scene depth texture? */
    public collision: boolean = false;

    public gravity: vec3 = new vec3();

    public updateInterval: number = 1.0 / 60.0;

    public get isEmitting(): boolean {return this._isEmitting;}

    //#endregion

    //#region private fields

    private _maxParticleCount: number = 0;
    /**
     * increase every frame by emit rate;
     * will not subtract newly dead particles.
     * this is only to control how many instances are updated and rendered when drawElementsInstanced
     */
    private _curParticleCount: number = 0;
    
    /**
     * cur head (first) particle index
     * will start from 0 when reach the max particle count.
     * this is passed into update shader to control the respawning of dead particles
     */
    private _curHeadParticle: number = 0;

    /** will be passed in shader to control emitting */
    private _isEmitting = false;

    /** read and write vertex buffer */
    private _vertexBuffers: VertexBuffer[] = [];
    /** vertex attributes for read and write vertex buffers */
    private _updateAttributes: VertexBufferAttribute[][] = [];

    // use VAOs
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

    /** help generate fake random values in update vertex shader */
    private _randomTexture: Texture2D | null = null;

    private _colorGradients: Gradient<vec4>[] | null = null;
    private _sizeGradients: Gradient<vec3>[] | null = null;

    private _colorGradientTexture: Texture2D | null = null;
    private _sizeGradientTexture: Texture2D | null = null;

    private static readonly _gradientTextureWidth: number = 256;

    private _colorGradientTextureDirty: boolean = false;
    private _sizeGradientTextureDirty: boolean = false;

    /** approximate largest bounding sphere in local space? */
    protected _localBoundingSphere: BoundingSphere = new BoundingSphere();
    /** world space bounding sphere */
    protected _boundingSphere: BoundingSphere = new BoundingSphere();
    /** world space emitter transform */
    // protected _emitterTransform: mat4 = new mat4();

    private static _rotRefDir: vec3 = new vec3();

    private static _tmpVec3: vec3 = new vec3();

    // private static _tmpMat4: mat4 = new mat4();

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
            // rotate angle and speed: vec2
            data.push(0, 0);
            // noiseTexcoord
            // data.push(0, 0);
        }
        
        const gl = GLDevice.gl;

        // create vertex buffers
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
            updateAttribSet.addAttribute("p_ageLife", DefaultParticleAttributes.AGE_LIFE, vb, 2, gl.FLOAT, 0);
            updateAttribSet.addAttribute("p_seed", DefaultParticleAttributes.SEED, vb, 4, gl.FLOAT, 0);
            updateAttribSet.addAttribute("p_size", DefaultParticleAttributes.SIZE, vb, 3, gl.FLOAT, 0);
            updateAttribSet.addAttribute("p_color", DefaultParticleAttributes.COLOR, vb, 4, gl.FLOAT, 0);
            updateAttribSet.addAttribute("p_frameIdx", DefaultParticleAttributes.FRAME_INDEX, vb, 1, gl.FLOAT, 0);
            updateAttribSet.addAttribute("p_angle", DefaultParticleAttributes.ANGLE_ROTSPEED, vb, 2, gl.FLOAT, 0);
            // updateAttribSet.addAttribute("p_noiseTexCoord", DefaultParticleAttributes.NOISE_TEXCOORD, vb, 2, gl.FLOAT, 0);

            vb.stride = updateAttribSet.curSizeInBytes;

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
            // add geometry vertex attributes first
            for (const geomAttr of this.geometry.attributes) {
                renderAttribSet.addAttribute(geomAttr.name, geomAttr.location, geomAttr.buffer, geomAttr.size, geomAttr.componentType, 0);
                // locationOffset = Math.max(locationOffset, geomAttr.location);
            }

            // then add particle instance attributes with offseted location
            // NOTE: if modify this, need to modify location macros in psys_gpu_render.vs.glsl.ts
            let locationOffset = 5;

            // vertex buffer changed, reset the byte offset.
            renderAttribSet.curSizeInBytes = 0;

            // set divisor to 1 (per instance)
            renderAttribSet.addAttribute("p_position", DefaultParticleAttributes.POSITION + locationOffset, vb, 3, gl.FLOAT, 1);
            renderAttribSet.addAttribute("p_direction", DefaultParticleAttributes.DIRECTION + locationOffset, vb, 3, gl.FLOAT, 1);
            renderAttribSet.addAttribute("p_ageLife", DefaultParticleAttributes.AGE_LIFE + locationOffset, vb, 2, gl.FLOAT, 1);
            renderAttribSet.addAttribute("p_seed", DefaultParticleAttributes.SEED + locationOffset, vb, 4, gl.FLOAT, 1);
            renderAttribSet.addAttribute("p_size", DefaultParticleAttributes.SIZE + locationOffset, vb, 3, gl.FLOAT, 1);
            renderAttribSet.addAttribute("p_color", DefaultParticleAttributes.COLOR + locationOffset, vb, 4, gl.FLOAT, 1);
            renderAttribSet.addAttribute("p_frameIdx", DefaultParticleAttributes.FRAME_INDEX + locationOffset, vb, 1, gl.FLOAT, 1);
            renderAttribSet.addAttribute("p_angle", DefaultParticleAttributes.ANGLE_ROTSPEED + locationOffset, vb, 2, gl.FLOAT, 1);
            // renderAttribSet.addAttribute("p_noiseTexCoord", DefaultParticleAttributes.NOISE_TEXCOORD + locationOffset, vb, 2, gl.FLOAT, 1);

            // vertex buffer stride has been setted already.

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

        // create random texture

        this._randomTexture = new Texture2D(1024, 1, 1, 1, gl.RGBA, gl.FLOAT, false);
        const floats = 1024 * 4;
        this._randomTexture.image = new Float32Array(floats);
        for (let i = 0; i < floats; i++) {
            this._randomTexture.image[i] = Math.random();
        }
        this._randomTexture.samplerState = new SamplerState(gl.REPEAT, gl.REPEAT, gl.NEAREST, gl.NEAREST);
        this._randomTexture.upload();

        this.estimateBoundingSphere();
    }

    public destroy() {
        this._isEmitting = false;
        
        for (const feedback of this._transformFeedbacks) {
            feedback.release();
        }
        this._transformFeedbacks.length = 0;

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

        if (this._randomTexture !== null) {
            this._randomTexture.release();
            this._randomTexture = null;
        }

        if (this._colorGradientTexture !== null) {
            this._colorGradientTexture.release();
            this._colorGradientTexture = null;
        }

        if (this._sizeGradientTexture !== null) {
            this._sizeGradientTexture.release();
            this._sizeGradientTexture = null;
        }
    }

    /**
     * start emitting
     */
    public start() {
        this._isEmitting = true;
        // ensure the particles will emit continuously
        this._curHeadParticle = 0;
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
        this._curHeadParticle = 0;
        this._isEmitting = false;

        // fix me: need to reset particle vertex data?
    }

    // todo: prewarm?
    // set a prewarm flag for entire rendering loop?

    // note: when update, use buffer A as source,
    // and also use buffer A as source when render;
    // this will prevent waiting for the transform feedback finished?
    // after render, swap the buffer B as source buffer.
    // todo: pass in (last frame?) scene normal and depth texture
    // call this by renderer before render
    public update(startTexUnit: number) {

        // have material?
        let mtl = this.material;
        if (mtl === null) {
            mtl = GPUParticleSystem.defaultMaterial;
        }
        if (mtl === null || mtl.updateProgram === null) {
            return;
        }

        // curr particle count
        // note: need to use float value

        // todo; add a curr first particle index (particle queue head)
        // for the situation that start emitting again after stop. 

        if(this._isEmitting) {

            if (this.oneShot) {
                // use emit rate as count?
                this._curParticleCount = this.emitRate;
                this._curHeadParticle = this.emitRate;
            } else {
                // emit count in this frame
                // use a steady elapsed time to prevent un-even emitting
                const emitCount = this.updateInterval * this.emitRate;
                this._curParticleCount += emitCount;
                this._curHeadParticle += emitCount;
                // this._curParticleCount += Clock.instance.elapsedTime * this.emitRate;
            }
        }

        // estimate a max alive count by life and emit rate?
        const maxCount = Math.min(this._maxParticleCount, this.maxLife * this.emitRate);

        this._curParticleCount = Math.min(this._curParticleCount, maxCount);

        while (this._curHeadParticle > maxCount) {
            this._curHeadParticle -= maxCount;
        }

        const updateCount = Math.floor(this._curParticleCount);
        if (updateCount > 0) {

            // pingpong the buffers before update
            // because we don't know how many times the particle system will be rendered.
            // if have some problem, try init _curSourceIndex as 1
            this._curSourceIndex++;
            if (this._curSourceIndex >= 2) {
                this._curSourceIndex = 0;
            }

            const gl = GLDevice.gl;

            // bind update VAO
            GLGeometryBuffers.bindVertexBufferArray(this._updateVAO[this._curSourceIndex]);
            GLTransformFeedbacks.bindTransformFeedback(this._transformFeedbacks[this._curSourceIndex]);
            
            // attrib divisors? should have been recorded in VAO
            
            // turn off rasterization
            GLDevice.discardResterization = true;

            const updateProgram = mtl.updateProgram;

            GLPrograms.useProgram(updateProgram);

            // set psys properties to uniforms
            // too much... consider use an UBO?
            // GPUParticleSystem._tmpMat4.fromScaling(this.emitterSize);
            // mat4.product(this.worldTransform, GPUParticleSystem._tmpMat4, this._emitterTransform);

            // use a steady elapsed time to prevent un-even emitting
            gl.uniform1f(updateProgram.getUniformLocation("u_elapsedTime"), this.updateInterval);
            // gl.uniform1f(updateProgram.getUniformLocation("u_elapsedTime"), Clock.instance.elapsedTime);
            gl.uniform3f(updateProgram.getUniformLocation("u_gravity"), this.gravity.x, this.gravity.y, this.gravity.z);
            gl.uniform2f(updateProgram.getUniformLocation("u_curHead_randCount"), this._curHeadParticle, Math.random() * this._curParticleCount);
            // gl.uniform2f(updateProgram.getUniformLocation("u_curHead_randCount"), this._curParticleCount, Math.random() * this._curParticleCount);
            gl.uniform1i(updateProgram.getUniformLocation("u_isEmitting"), this._isEmitting ? 1 : 0);
            gl.uniform1i(updateProgram.getUniformLocation("u_emitterShape"), this.emitterShape);
            gl.uniform3f(updateProgram.getUniformLocation("u_emitterSize"), this.emitterSize.x, this.emitterSize.y, this.emitterSize.z);
            gl.uniformMatrix4fv(updateProgram.getUniformLocation("u_emitterModelTransform"), false, this.worldTransform.values);
            // gl.uniformMatrix4fv(updateProgram.getUniformLocation("u_emitterModelTransform"), false, this._emitterTransform.values);
            gl.uniform4f(updateProgram.getUniformLocation("u_emitDir_variation"), this.emitDirection.x, this.emitDirection.y, this.emitDirection.z, this.emitDirectionVariation);
            gl.uniform4f(updateProgram.getUniformLocation("u_texAnimFrameInfo"), this.texAnimStartFrame, this.texAnimEndFrame, this.texAnimFrameIncreaseSpeed, this.randomAnimStartFrame ? 1 : 0);
            gl.uniform2f(updateProgram.getUniformLocation("u_lifeRange"), this.minLife, this.maxLife);
            gl.uniform2f(updateProgram.getUniformLocation("u_speedRange"), this.minSpeed, this.maxSpeed);
            gl.uniform2f(updateProgram.getUniformLocation("u_angleRange"), this.minAngle, this.maxAngle);
            gl.uniform2f(updateProgram.getUniformLocation("u_angularSpeedRange"), this.minAngularSpeed, this.maxAngularSpeed);
            gl.uniform3f(updateProgram.getUniformLocation("u_minSize"), this.minSize.x, this.minSize.y, this.minSize.z);
            gl.uniform3f(updateProgram.getUniformLocation("u_maxSize"), this.maxSize.x, this.maxSize.y, this.maxSize.z);
            gl.uniform1i(updateProgram.getUniformLocation("u_collision"), this.collision ? 1 : 0);
            gl.uniform4f(updateProgram.getUniformLocation("u_color1"), this.color1.x, this.color1.y, this.color1.z, this.color1.w);
            gl.uniform4f(updateProgram.getUniformLocation("u_color2"), this.color2.x, this.color2.y, this.color2.z, this.color2.w);
            
            // where to set textures for updating and sampler uniforms?
            // scene depth and normal texture
            // since we need to use these two textures, we must draw all particles after opaque objects finished drawing
            // and we can not render to these two textures.

            // or can we use last frame of these textures ? need to double-buffer depth and normal texture in renderer too.
            // particles with collision detecting still can not write to depth buffer; or they will collide with themselves in last frame...

            // random textures, gradiant textures...
            
            let texUnit = startTexUnit;
            GLTextures.setTextureAt(texUnit, this._randomTexture);
            gl.uniform1i(updateProgram.getUniformLocation("s_randomTexture"), texUnit);
            texUnit++;

            // set material specific params
            mtl.setUpdateProgramUniforms(this, texUnit);

            // begin transform feedback
            GLTransformFeedbacks.beginTransformFeedback(gl.POINTS);

            gl.drawArrays(gl.POINTS, 0, this._curParticleCount);
            
            GLTransformFeedbacks.endTransformFeedback();

            // turn on rasterization
            GLDevice.discardResterization = false;
            // bind VAO and transform buffers to null
            // this should also bind transform feedback output buffer to null
            GLTransformFeedbacks.bindTransformFeedback(null);
            // GLPrograms.useProgram(null);
        }
        // if one shot, stop automatically after shot.
        if (this.isEmitting && this.oneShot) {
            this.stop();
        }
    }

    /**
     * fix me: may be rendered to different targets in different phase (does particles drop shadow)?
     * do not know will be rendered how many times
     * so should swap update and render vertex buffer after last render (or before update?)
     * @param startTexUnit 
     */
    public render(startTexUnit: number) {
        const geometry = this.geometry;
        if(geometry === null) return;

        let mtl = this.material;
        if (mtl === null) {
            mtl = GPUParticleSystem.defaultMaterial;
        }
        if (mtl === null || mtl.renderProgram === null) {
            return;
        }

        const drawCount = Math.floor(this._curParticleCount);
        if (drawCount > 0) {

            this.updateColorGradientTexture();
            this.updateSizeGradientTexture();

            // set material render states
            // if use collision, do not write depth buffer?
            if(mtl.blendState !== null) GLRenderStates.setBlendState(mtl.blendState);
            if(mtl.cullState !== null) GLRenderStates.setCullState(mtl.cullState);
            if(mtl.depthStencilState != null) GLRenderStates.setDepthStencilState(mtl.depthStencilState);

            const gl = GLDevice.gl;

            // use render program
            const renderProgram = mtl.renderProgram;

            GLPrograms.useProgram(renderProgram);

            // todo: uniforms
            // transform axises to world space before pass in shader
            // GPUParticleSystem._tmpVec3.(this.rotationLimitAxis);
            const rotLimAxisWS = GPUParticleSystem._tmpVec3;
            this.worldTransform.multiplyVec3Normal(this.rotationLimitAxis, rotLimAxisWS);

            gl.uniform1i(renderProgram.getUniformLocation("u_isBillboard"), this.isBillboard ? 1 : 0);
            gl.uniform1i(renderProgram.getUniformLocation("u_rotationLimit"), this.rotationLimit);
            gl.uniform3f(renderProgram.getUniformLocation("u_limitAxis"), rotLimAxisWS.x, rotLimAxisWS.y, rotLimAxisWS.z);

            gl.uniform1i(renderProgram.getUniformLocation("u_softParticle"), this.softParticle ? 1 : 0);

            // todo: calc a ref dir automatically? or add a property?
            // which is better?
            let v = this.rotationLimitAxis;
            if (this.rotationLimit == RotationLimitMode.Axis) {

            } else if (this.rotationLimit == RotationLimitMode.MoveDir) {
                v = this.emitDirection;
            }
            // fix me: need to transform v to world space?
            // transform here or transform in vertex shader?
            // find the smallest component?
            let rotRefDir = GPUParticleSystem._rotRefDir;
            if(Math.abs(v.x) < Math.abs(v.y) && Math.abs(v.x) < Math.abs(v.z)) {
                rotRefDir.setComponents(1, 0, 0);
            } else if(Math.abs(v.y) < Math.abs(v.z)) {
                rotRefDir.setComponents(0, 1, 0);
            } else {
                rotRefDir.setComponents(0, 0, 1);
            }

            let rotRefDirWS = GPUParticleSystem._tmpVec3;
            this.worldTransform.multiplyVec3Normal(rotRefDir, rotRefDirWS);
        
            gl.uniform3f(renderProgram.getUniformLocation("u_refDir"), rotRefDirWS.x, rotRefDirWS.y, rotRefDirWS.z);

            // todo: textures
            // some scene textures: irradiance probes;
            gl.uniform1i(renderProgram.getUniformLocation("s_shadowAtlas"), SceneTextureUnits.shadowmapAtlas);
            gl.uniform1i(renderProgram.getUniformLocation("s_irrProbeArray"), SceneTextureUnits.irradianceProbeArray);
            gl.uniform1i(renderProgram.getUniformLocation("s_envMapArray"), SceneTextureUnits.envMapArray);

            // hold cur tex unit here? or use GLTextures class?
            let texUnit = startTexUnit;

            // depth texture, for soft particles;
            // fix me: can not use this frame depth texture, because it may being used as render target
            // use a last frame depth?

            // color gradient texture
            const colorGradLoc = renderProgram.getUniformLocation("s_colorGradient");
            if(colorGradLoc !== null) {
                GLTextures.setTextureAt(texUnit, this._colorGradientTexture);
                gl.uniform1i(colorGradLoc, texUnit);
                texUnit++;
            }

            // size gradient texture
            const sizeGradLoc = renderProgram.getUniformLocation("s_sizeGradient");
            if (sizeGradLoc !== null) {
                GLTextures.setTextureAt(texUnit, this._sizeGradientTexture);
                gl.uniform1i(sizeGradLoc, texUnit);
                texUnit++;
            }

            // flags
            const useGradLoc = renderProgram.getUniformLocation("u_useGradientTextures");
            if (useGradLoc !== null) {
                gl.uniform4i(useGradLoc,
                    this._colorGradientTexture !== null ? 1 : 0,
                    this._sizeGradientTexture !== null ? 1 : 0,
                    0, 0);
            }

            // particle own texture (with animation frames?)
            // let material set them?
            // use SamplerUniforms?
            mtl.setRenderProgramUniforms(this, texUnit);

            // bind render VAO
            // (render VAO and update VAO use different particle vertex buffer)
            GLGeometryBuffers.bindVertexBufferArray(this._renderVAO[this._curSourceIndex]);

            // drawinstanced
            if (geometry.indexBuffer !== null) {
                gl.drawElementsInstanced(geometry.drawMode, geometry.indexBuffer.count, geometry.indexBuffer.componentType, 0, this._curParticleCount );
            } else {
                gl.drawArraysInstanced(geometry.drawMode, 0, geometry.vertexBuffers[0].vertexCount, this._curParticleCount);
            }

            // restore render VAO?
            GLGeometryBuffers.bindVertexBufferArray(null);

            // pingpong the buffers? now?
            // this._curSourceIndex++;
            // if (this._curSourceIndex >= 2) {
            //     this._curSourceIndex = 0;
            // }
        }
    }

    public provideRenderItem(renderList: RenderList) {
        // provide here, then check if is gpuPsys in renderer?
        if (this.geometry) {
            // can only have one primitive; use my material
            renderList.addRenderItem(this, this.geometry, 0, Infinity, this.material !== null ? this.material : GPUParticleSystem.defaultMaterial);
        }
    }

    protected onWorldTransformUpdated() {
        // fix me: can not access renderer here?
        // this.update();

        // in case the start speed, gravity or life changed.
        this.estimateBoundingSphere();

        this._localBoundingSphere.transform(this.worldTransform, this._boundingSphere);
    }

    protected estimateBoundingSphere() {
        // estimate largest local space bounding sphere?
        // according to start velocity, gravity, life and geometry bounding sphere?
        const accel = this.gravity.length();
        let radius = this.maxSpeed * this.maxLife + 0.5 * accel * this.maxLife * this.maxLife;

        if (this.geometry !== null) {
            radius += this.geometry.boundingSphere.radius;
        }

        this._localBoundingSphere.radius = radius;
    }

    protected updateColorGradientTexture() {
        if (this._colorGradientTextureDirty) {
            if (this._colorGradients !== null && this._colorGradients.length > 0) {
                const numPixels = GPUParticleSystem._gradientTextureWidth;
                if (this._colorGradientTexture === null) {
                    const gl = GLDevice.gl;
                    this._colorGradientTexture = new Texture2D(numPixels, 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, false);
                    this._colorGradientTexture.samplerState = new SamplerState(gl.CLAMP_TO_EDGE, gl.REPEAT, gl.LINEAR, gl.LINEAR);
                }
                const image = new Uint8Array(numPixels * 4);
                for (let i = 0; i < numPixels; i++) {
                    GradientHelper.GetCurrentGradient(i / numPixels, this._colorGradients, (curr, next, s) => {
                        image[i * 4 + 0] = Math.max(0, Math.min((curr.value.r * (1 - s) + next.value.r * s), 1)) * 255;
                        image[i * 4 + 1] = Math.max(0, Math.min((curr.value.g * (1 - s) + next.value.g * s), 1)) * 255;
                        image[i * 4 + 2] = Math.max(0, Math.min((curr.value.b * (1 - s) + next.value.b * s), 1)) * 255;
                        image[i * 4 + 3] = Math.max(0, Math.min((curr.value.a * (1 - s) + next.value.a * s), 1)) * 255;
                    });
                }
                this._colorGradientTexture.image = image;
                this._colorGradientTexture.upload();
            } else {
                // release the texture?
                if (this._colorGradientTexture !== null) {
                    this._colorGradientTexture.release();
                    this._colorGradientTexture = null;
                }
            }
            this._colorGradientTextureDirty = false;
        }
    }

    protected updateSizeGradientTexture() {
        if (this._sizeGradientTextureDirty) {
            if (this._sizeGradients !== null && this._sizeGradients.length > 0) {
                const numPixels = GPUParticleSystem._gradientTextureWidth;
                if (this._sizeGradientTexture === null) {
                    const gl = GLDevice.gl;
                    this._sizeGradientTexture = new Texture2D(numPixels, 1, 1, 1, gl.RGB, gl.FLOAT, false);
                    this._sizeGradientTexture.samplerState = new SamplerState(gl.CLAMP_TO_EDGE, gl.REPEAT, gl.LINEAR, gl.LINEAR);
                }
                const image = new Float32Array(numPixels * 3);
                for (let i = 0; i < numPixels; i++) {
                    GradientHelper.GetCurrentGradient(i / numPixels, this._sizeGradients, (curr, next, s) => {
                        image[i * 3 + 0] = curr.value.x * (1 - s) + next.value.x * s;
                        image[i * 3 + 1] = curr.value.y * (1 - s) + next.value.y * s;
                        image[i * 3 + 2] = curr.value.z * (1 - s) + next.value.z * s;
                    });
                }
                this._sizeGradientTexture.image = image;
                this._sizeGradientTexture.upload();
            } else {
                if (this._sizeGradientTexture !== null) {
                    this._sizeGradientTexture.release();
                    this._sizeGradientTexture = null;
                }
            }
            this._sizeGradientTextureDirty = false;
        }
    }

    //#endregion
}
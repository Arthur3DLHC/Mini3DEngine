import vec3 from "../../lib/tsm/vec3.js";
import { FrameBuffer } from "../WebGLResources/frameBuffer.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { RenderStateCache } from "../WebGLResources/renderStateCache.js";
import { SamplerState } from "../WebGLResources/renderStates/samplerState.js";
import { ShaderProgram } from "../WebGLResources/shaderProgram.js";
import { Texture2D } from "../WebGLResources/textures/texture2D.js";
import { ClusteredForwardRenderContext } from "./clusteredForwardRenderContext.js";
import { RenderStateSet } from "./renderStateSet.js";

export class ObjectPickQuery {
    public constructor(x: number, y: number, width: number, height: number, onPick: (tag: number, id: number, depth: number, normal: vec3) => void) {
        this.x = x; this.y = y; this.width = width, this.height = height;
        this.onPick = onPick;
    }

    public x: number = 0;
    public y: number = 0;
    public width: number = 0;
    public height: number = 0;

    public onPick: (tag: number, id: number, depth: number, normal: vec3) => void;
}

/**
 * this class is for pixel level picking
 * use GPU to do pixel level picking, instead of doing intersection detecting by javascript 
 */
export class ObjectIDRenderer {
    // query pick?
    // every pick can register an event hanlder?
    public constructor() {
        const gl = GLDevice.gl;

        const width = Math.floor(GLDevice.canvas.width / 2);
        const height = Math.floor(GLDevice.canvas.height / 2);

        if (width === 0 || height === 0) {
            throw new Error("picking RT zero size");
        }

        // create textures and FBO, in half canvas size
        const sampler = new SamplerState(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST, gl.NEAREST);

        this._objectIDTexture = new Texture2D(width, height, 1, 1, gl.RG, gl.UNSIGNED_SHORT, false);
        this._normalTexture = new Texture2D(width, height, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, false);
        this._depthTexture = new Texture2D(width, height, 1, 1, gl.RED, gl.FLOAT, false);

        this._objectIDTexture.samplerState = sampler;
        this._normalTexture.samplerState = sampler;
        this._depthTexture.samplerState = sampler;

        this._objectIDTexture.create();
        this._normalTexture.create();
        this._depthTexture.create();

        this._pickingFBO = new FrameBuffer();
        this._pickingFBO.attachTexture(0, this._objectIDTexture);
        this._pickingFBO.attachTexture(1, this._normalTexture);
        this._pickingFBO.attachTexture(2, this._depthTexture);
        this._pickingFBO.prepare();

        // render state
        this._copyRenderState = new RenderStateSet();
        this._copyRenderState.blendState = RenderStateCache.instance.getBlendState(false, gl.FUNC_ADD, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this._copyRenderState.colorWriteState = RenderStateCache.instance.getColorWriteState(true, true, true, true);
        this._copyRenderState.cullState = RenderStateCache.instance.getCullState(false, gl.BACK);
        this._copyRenderState.depthState = RenderStateCache.instance.getDepthStencilState(false, false, gl.ALWAYS);

        // todo: build shader programs
    }

    //#region private fields

    // queries
    private _queries: ObjectPickQuery[] = [];

    /** RGBA8 encoded normal */
    private _normalTexture: Texture2D;
    /** RG16i object tag and id */
    private _objectIDTexture: Texture2D;
    /** F32 view space linear depth */
    private _depthTexture: Texture2D;

    private _pickingFBO: FrameBuffer;

    // shader program
    // private _objectIDProgram: ShaderProgram;

    // render state
    private _copyRenderState: RenderStateSet;

    // render list (visible and pickable Object3Ds)
    
    //#endregion

    //#region public methods

    // in the begining of every frame, check if there are any picking queries;
    // if there are, read back pixels for every pick and check picking result?
    // clear the picking queries;
    public processQueries() {
        // todo: read pixels back from scene normal RT?
        // read depth from scene main depth buffer?
        // need to get the RTs from clusteredForwardRenderer?
        for (const query of this._queries) {
            
        }

        this._queries.length = 0;
    }

    public queryPick(query: ObjectPickQuery) {
        this._queries.push(query);
    }

    /**
     * in the end of every frame, check if there are new picking queries;
     * if so, render all pickable object IDs to picking FBO.
     * or copy the normal, object ID and tag, depth from scene RTs in query boundary rect to part of a RGBA32F FBO 
     * this can prevent read back and process half-float values in js
     * and also prevent the halt of GPU pipeline?
     * need to downsample and change the output fromat, so can not use gl.blitFramebuffer(). draw textured quads instead.
     * @param context render context needed for set the object UBO
     * @param sceneNormalTex texture contains scene normal and object tag and ID
     * @param sceneDepthTex main depth texture, to compute the view z distance.
     */
    public renderIfNeeded(context: ClusteredForwardRenderContext, sceneNormalTex: Texture2D, sceneDepthTex: Texture2D) {
        if (this._queries.length > 0) {
            // accumulate query rectangle

            // render quad, transfer datas in rectange from scene textures to picking RT
        }
    }

    //#endregion
}
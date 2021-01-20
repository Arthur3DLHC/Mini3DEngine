import objectTag_fs from "./shaders/objectTag_fs.glsl.js";
import objectTag_vs from "./shaders/objectTag_vs.glsl.js";

import vec3 from "../../lib/tsm/vec3.js";
import { PlaneGeometry } from "../geometry/common/planeGeometry.js";
import { FrameBuffer, PixelReadingRect } from "../WebGLResources/frameBuffer.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { RenderStateCache } from "../WebGLResources/renderStateCache.js";
import { SamplerState } from "../WebGLResources/renderStates/samplerState.js";
import { ShaderProgram } from "../WebGLResources/shaderProgram.js";
import { Texture2D } from "../WebGLResources/textures/texture2D.js";
import { ClusteredForwardRenderContext } from "./clusteredForwardRenderContext.js";
import { RenderStateSet } from "./renderStateSet.js";
import { GLPrograms } from "../WebGLResources/glPrograms.js";
import { GLUniformBuffers } from "../WebGLResources/glUnifomBuffers.js";
import vec4 from "../../lib/tsm/vec4.js";
import vec2 from "../../lib/tsm/vec2.js";
import { GLTextures } from "../WebGLResources/glTextures.js";

export class ObjectPickResult {
    /** object tag */
    public tag: number = -1;
    /** average normal in view space */
    public normal: vec3 = new vec3();
    /** nearest depth in view space (negative!) */
    public depth: number = -Infinity;

    /** internal use */
    public _normalCount: number = 0;
}

export class ObjectPickQuery {
    public constructor(x: number, y: number, width: number, height: number, onPick: (results: Map<number, ObjectPickResult>) => void) {
        this.x = x; this.y = y; this.width = width, this.height = height;
        this.onPick = onPick;
    }

    public x: number = 0;
    public y: number = 0;
    public width: number = 0;
    public height: number = 0;

    public onPick: (results: Map<number, ObjectPickResult>) => void;
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

        this._tagPixels = new Uint32Array(width * height);
        this._normalPixels = new Uint8Array(width * height * 4);
        this._depthPixels = new Float32Array(width * height);

        // create textures and FBO, in half canvas size
        const sampler = new SamplerState(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST, gl.NEAREST);

        // if want to use a integer texture, need to use RED_INTEGER fromat
        this._objectTagTexture = new Texture2D(width, height, 1, 1, gl.RED_INTEGER, gl.INT, false);
        this._normalTexture = new Texture2D(width, height, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, false);
        this._depthTexture = new Texture2D(width, height, 1, 1, gl.RED, gl.FLOAT, false);

        this._objectTagTexture.samplerState = sampler;
        this._normalTexture.samplerState = sampler;
        this._depthTexture.samplerState = sampler;

        this._objectTagTexture.create();
        this._normalTexture.create();
        this._depthTexture.create();

        this._pickingFBO = new FrameBuffer();
        this._pickingFBO.attachTexture(0, this._objectTagTexture);
        this._pickingFBO.attachTexture(1, this._normalTexture);
        this._pickingFBO.attachTexture(2, this._depthTexture);
        this._pickingFBO.prepare();

        this._pickingReadRects = [];
        this._pickingReadRects.push(new PixelReadingRect(gl.COLOR_ATTACHMENT0, 0, 0, width, height, gl.RED_INTEGER, gl.INT, 1, this._tagPixels));
        this._pickingReadRects.push(new PixelReadingRect(gl.COLOR_ATTACHMENT1, 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, 4, this._normalPixels));
        this._pickingReadRects.push(new PixelReadingRect(gl.COLOR_ATTACHMENT2, 0, 0, width, height, gl.RED, gl.FLOAT, 1, this._depthPixels));

        // render state
        this._copyRenderState = new RenderStateSet();
        this._copyRenderState.blendState = RenderStateCache.instance.getBlendState(false, gl.FUNC_ADD, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this._copyRenderState.colorWriteState = RenderStateCache.instance.getColorWriteState(true, true, true, true);
        this._copyRenderState.cullState = RenderStateCache.instance.getCullState(false, gl.BACK);
        this._copyRenderState.depthState = RenderStateCache.instance.getDepthStencilState(false, false, gl.ALWAYS);

        // build shader programs
        const shaderCodes = GLPrograms.shaderCodes;
        if (shaderCodes["objectTag_vs"] === undefined) shaderCodes["objectTag_vs"] = objectTag_vs;
        if (shaderCodes["objectTag_fs"] === undefined) shaderCodes["objectTag_fs"] = objectTag_fs;

        this._objectTagProgram = new ShaderProgram();
        this._objectTagProgram.vertexShaderCode = GLPrograms.processSourceCode(shaderCodes["objectTag_vs"]);
        this._objectTagProgram.fragmentShaderCode = GLPrograms.processSourceCode(shaderCodes["objectTag_fs"]);
        this._objectTagProgram.build();

        // uniform blocks
        // only view UBO needed?
        GLUniformBuffers.bindUniformBlock(this._objectTagProgram, "View");

        // geometry
        this._rectGeom = new PlaneGeometry(2, 2, 1, 1);
        this._texcoordScaleOffset = new vec4([1, 1, 0, 0]);
    }

    //#region private fields

    // queries
    private _queries: ObjectPickQuery[] = [];

    /** cur sum rectange of all queries, in half resolution? */
    private _curSumRectXY: vec2 = new vec2();
    private _curSumRectSize: vec2 = new vec2();

    /** RGBA8 encoded normal */
    private _normalTexture: Texture2D;
    /** R32I object tag */
    private _objectTagTexture: Texture2D;
    /** F32 view space linear depth */
    private _depthTexture: Texture2D;

    private _pickingFBO: FrameBuffer;

    private _normalPixels: Uint8Array;
    private _tagPixels: Uint32Array;
    private _depthPixels: Float32Array;

    private _pickingReadRects: PixelReadingRect[];

    private _pickResults: Map<number, ObjectPickResult> = new Map<number, ObjectPickResult>();

    // shader program
    private _objectTagProgram: ShaderProgram;

    // render state
    private _copyRenderState: RenderStateSet;

    // render list (visible and pickable Object3Ds)
    // a geometry to render screen space rectangles
    private _rectGeom: PlaneGeometry;
    /** xy: scale, zw: offset */
    private _texcoordScaleOffset: vec4;
    
    //#endregion

    //#region public methods

    // in the begining of every frame, check if there are any picking queries;
    // if there are, read back pixels for every pick and check picking result?
    // clear the picking queries;
    public processQueries() {
        if (this._queries.length > 0) {
            // todo: read pixels back from scene normal RT?
            // read depth from scene main depth buffer?
            // need to get the RTs from clusteredForwardRenderer?
            for (const rc of this._pickingReadRects) {
                rc.width = this._curSumRectSize.x;
                rc.height = this._curSumRectSize.y;
            }
            this._pickingFBO.readPixelsMultiple(this._pickingReadRects);

            // then check every query
            for (const query of this._queries) {
                this._pickResults.clear();

                // use a set to store tags in the rect
                // if have some tag in rect, 
                const l = query.x / 2 - this._curSumRectXY.x;
                const t = query.y / 2 - this._curSumRectXY.y;
                const width = query.width / 2;
                const height = query.height / 2;

                for (let y = t; y < t + height; y++) {
                    const lineStart = y * width;
                    for (let x = l; x < l + width; x++) {
                        const idx = lineStart + x;
                        const tag = this._tagPixels[idx * this._pickingReadRects[0].pixelStride];

                        // pickable
                        if (tag >= 0) {
                            // tags.add(tag);
                            let result = this._pickResults.get(tag);
                            if (result === undefined) {
                                result = new ObjectPickResult();
                                this._pickResults.set(tag, result);

                                result.tag = tag;
                            }

                            let nx = this._normalPixels[idx * this._pickingReadRects[1].pixelStride];
                            let ny = this._normalPixels[idx * this._pickingReadRects[1].pixelStride + 1];
                            let nz = this._normalPixels[idx * this._pickingReadRects[1].pixelStride + 2];
    
                            const colorToN = 2.0 / 255.0;
                            nx = nx * colorToN - 1.0;
                            ny = ny * colorToN - 1.0;
                            nz = nz * colorToN - 1.0;
                            result.normal.x += nx; result.normal.y += ny; result.normal.z += nz;
                            result._normalCount++;

                            const pixDepth = this._depthPixels[idx * this._pickingReadRects[2].pixelStride];
                            result.depth = Math.max(result.depth, pixDepth);
                        }
                    }
                }

                if (this._pickResults.size > 0) {
                    for (const pair of this._pickResults) {
                        if (pair[1]._normalCount > 0) {
                            pair[1].normal.scale(1.0 / pair[1]._normalCount);
                            pair[1].normal.normalize();
                        }
                    }

                    query.onPick(this._pickResults);
                }
            }
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
    public renderIfNeeded(context: ClusteredForwardRenderContext, sceneNormalTex: Texture2D, sceneDepthTex: Texture2D, startTexUnit: number) {
        if (this._queries.length > 0) {
            // accumulate query rectangle
            let x0: number = Number.MAX_VALUE;
            let y0: number = Number.MAX_VALUE;
            let x1: number = -Number.MAX_VALUE;
            let y1: number = -Number.MAX_VALUE;

            for (const query of this._queries) {
                x0 = Math.min(x0, query.x);
                y0 = Math.min(y0, query.y);
                x1 = Math.max(x1, query.x + query.width);
                y1 = Math.max(y1, query.y + query.height);
            }

            if (x1 > x0 && y1 > y0) {
                // query rect full res size
                let w = x1 - x0;
                let h = y1 - y0;

                // calculate texcoord scale offset
                const uvScaleOffset = this._texcoordScaleOffset;
                uvScaleOffset.x = w / sceneNormalTex.width;
                uvScaleOffset.y = h / sceneNormalTex.height;
                uvScaleOffset.z = x0 / sceneNormalTex.width;
                uvScaleOffset.w = y0 / sceneNormalTex.height;

                // render quad, transfer datas in rectange from scene textures to picking RT
                // since we limit the viewport, we can draw a full screen quad

                // calculate viewport?
                // need to half the size?
                this._curSumRectXY.x = x0 / 2;
                this._curSumRectXY.y = y0 / 2;

                this._curSumRectSize.x = w / 2;
                this._curSumRectSize.y = h / 2;

                // set render target
                let oldRT = GLDevice.renderTarget;
                GLDevice.renderTarget = this._pickingFBO;

                const gl = GLDevice.gl;

                gl.viewport(0, 0, this._curSumRectSize.x, this._curSumRectSize.y);
                gl.scissor(0, 0, this._curSumRectSize.x, this._curSumRectSize.y);

                // set these textures for all effects
                const sceneNormalTexUnit = startTexUnit;
                const sceneDepthTexUnit = startTexUnit + 1;
                GLTextures.setTextureAt(sceneNormalTexUnit, sceneNormalTex);
                GLTextures.setTextureAt(sceneDepthTexUnit, sceneDepthTex);

                this._copyRenderState.apply();

                GLPrograms.useProgram(this._objectTagProgram);
                gl.uniform1i(this._objectTagProgram.getUniformLocation("s_sceneNormal"), sceneNormalTexUnit);
                gl.uniform1i(this._objectTagProgram.getUniformLocation("s_sceneDepth"), sceneDepthTexUnit);
                gl.uniform4f(this._objectTagProgram.getUniformLocation("u_texcoordScaleOffset"), uvScaleOffset.x, uvScaleOffset.y, uvScaleOffset.z, uvScaleOffset.w);
                
                this._rectGeom.draw(0, Infinity, this._objectTagProgram.attributes);

                // restore render target?
                GLDevice.renderTarget = oldRT;
                // restore textures
                GLTextures.setTextureAt(sceneNormalTexUnit, null);
                GLTextures.setTextureAt(sceneDepthTexUnit, null);
            }
        }
    }

    //#endregion
}
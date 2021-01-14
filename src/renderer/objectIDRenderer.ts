import { Scene } from "../scene/scene.js";
import { FrameBuffer } from "../WebGLResources/frameBuffer.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { ShaderProgram } from "../WebGLResources/shaderProgram.js";
import { Texture2D } from "../WebGLResources/textures/texture2D.js";
import { ClusteredForwardRenderContext } from "./clusteredForwardRenderContext.js";
import { RenderList } from "./renderList.js";
import { RenderStateSet } from "./renderStateSet.js";

export class ObjectPickQuery {
    public constructor(x: number, y: number, width: number, height: number, onPick: (tag: number, id: number) => void) {
        this.x = x; this.y = y; this.width = width, this.height = height;
        this.onPick = onPick;
    }

    public x: number = 0;
    public y: number = 0;
    public width: number = 0;
    public height: number = 0;

    public onPick: (tag: number, id: number) => void;
}

/**
 * this class is for pixel level picking
 */
export class ObjectIDRenderer {
    // query pick?
    // every pick can register an event hanlder?
    public constructor() {
        const gl = GLDevice.gl;
    }

    //#region private fields

    // queries
    private _queries: ObjectPickQuery[] = [];

    // render target
    // private _objectIDTexture: Texture2D;
    // private _objectIDFBO: FrameBuffer;

    // shader program
    // private _objectIDProgram: ShaderProgram;

    // render state
    // private _objectIDRenderState: RenderStateSet;

    // render list (visible and pickable Object3Ds)
    
    //#endregion

    //#region public methods

    // in the begining of every frame, check if there are any picking queries;
    // if there are, read back pixels for every pick and check picking result?
    // clear the picking queries;
    public processQueries() {
        // todo: read pixels back from scene normal RT?
        // read depth from scene main depth buffer?
        for (const query of this._queries) {
            
        }

        this._queries.length = 0;
    }

    public queryPick(query: ObjectPickQuery) {
        this._queries.push(query);
    }

    // fix me: how to generate the render lists? generate them here?
    /**
     * in the end of every frame, check if there are new picking queries;
     * if so, render all pickable object IDs to picking FBO.
     * @param context render context needed for set the object UBO
     */
    public renderIfNeeded(context: ClusteredForwardRenderContext, renderList: RenderList) {
        if (this._queries.length > 0) {
            
        }
    }

    //#endregion
}
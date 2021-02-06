import { GLDevice } from "./glDevice.js";
import { VertexBuffer } from "./vertexBuffer.js";

export class TransformFeedback {
    public constructor() {

    }

    public outputBuffer: VertexBuffer | null = null;

    public get glTransformFeedback(): WebGLTransformFeedback | null { return this._glTransformFeedback; }

    private _glTransformFeedback: WebGLTransformFeedback | null = null;

    public prepare() {
        const gl = GLDevice.gl;

        if (this._glTransformFeedback === null) {
            this._glTransformFeedback = gl.createTransformFeedback();
        }

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this._glTransformFeedback);

        if (this.outputBuffer !== null) {
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.outputBuffer.glBuffer);
        } else {
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
        }

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    }

    public release() {
        if (this._glTransformFeedback !== null) {
            GLDevice.gl.deleteTransformFeedback(this._glTransformFeedback);
            this._glTransformFeedback = null;
        }
    }
}
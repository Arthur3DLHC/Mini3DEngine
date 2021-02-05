import { GLDevice } from "./glDevice.js";
import { TransformFeedback } from "./transformFeedback.js";

export class GLTransformFeedbacks {
    private static _curTransformFeedback: TransformFeedback | null = null;
    
    public static bindTransformFeedback(transformFeedback: TransformFeedback | null) {
        if (this._curTransformFeedback !== transformFeedback) {
            this._curTransformFeedback = transformFeedback;
            const gltfb = this._curTransformFeedback !== null ? this._curTransformFeedback.glTransformFeedback : null;
            GLDevice.gl.bindTransformFeedback(GLDevice.gl.TRANSFORM_FEEDBACK, gltfb);
            if (gltfb === null) {
                GLDevice.gl.bindBuffer(GLDevice.gl.TRANSFORM_FEEDBACK_BUFFER, null);
            }
        }
    }

    public static beginTransformFeedback(primitiveMode: number) {
        GLDevice.gl.beginTransformFeedback(primitiveMode);
    }

    public static endTransformFeedback() {
        GLDevice.gl.endTransformFeedback();
    }
}
import { Texture2D } from "../WebGLResources/textures/texture2D.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { FrameBuffer } from "../WebGLResources/frameBuffer.js";

/**
 * processor for subsurface scattering
 */
export class SubsurfaceProcessor {
    public constructor(){
        // todo: import subsurface pre-integrating shader code string
        // todo: build shader program

        // todo: bake pre-integrated BRDF texture
        // two channels: 
        // R: blurred NdotL
        // G: subsurface color intensity
        this.brdfTexture = new Texture2D(256, 256, 1, 1, GLDevice.gl.RG, GLDevice.gl.HALF_FLOAT, false);
        this.brdfTexture.create();

        // create a temp FBO, bind brdf texture
        const tmpFBO = new FrameBuffer();
        tmpFBO.setTexture(0, this.brdfTexture);
        tmpFBO.prepare();

        // set as rendertarget; set viewport and scissor
        GLDevice.renderTarget = tmpFBO;

        // use shader
        // render fullscreen quad
        // release FBO and shader
    }

    // pre-integrated BRDF texture
    public brdfTexture: Texture2D;
}
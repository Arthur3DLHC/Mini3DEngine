// shader codes
import cubemap_filter_diffuse_fs from "./shaders/cubemap_filter_diffuse_fs.glsl.js";
import cubemap_filter_diffuse_vs from "./shaders/cubemap_filter_diffuse_vs.glsl.js";

// modules
import { Texture2DArray } from "../WebGLResources/textures/texture2DArray";
import { FrameBuffer } from "../WebGLResources/frameBuffer";
import { GLPrograms } from "../WebGLResources/glPrograms.js";
import { ShaderProgram } from "../WebGLResources/shaderProgram.js";

/**
 * generate specular mipmaps of cubemaps (texture2darray)
 * generate ambient cube or SH from cubemap
 */
export class CubemapProcessor {
    public constructor() {
        // register shader code, if not registered?
        // use which vertex shader?
        if (GLPrograms.shaderCodes["cubemap_filter_diffuse_vs"] === undefined) {
            GLPrograms.shaderCodes["cubemap_filter_diffuse_vs"] = cubemap_filter_diffuse_vs;
        }

        // fragment shader
        if (GLPrograms.shaderCodes["cubemap_filter_diffuse_fs"] === undefined) {
            GLPrograms.shaderCodes["cubemap_filter_diffuse_fs"] = cubemap_filter_diffuse_fs;
        }
    }

    public processSpecular(source: Texture2DArray, dest: Texture2DArray) {
        // create a temp shader program?
        const program = new ShaderProgram();
        // create a temp FBO?
        const fbo = new FrameBuffer();

        // use 0 ~ 5 level as specular (64x64 to 4x4)
        // with different roughness

        // delete temp FBO
        fbo.release();
        // delete shader program
        program.release();
    }

    public processDiffuse(source: Texture2DArray, dest: Texture2DArray) {
        // create a temp shader program?
        const program = new ShaderProgram();

        // create a temp FBO?
        const fbo = new FrameBuffer();

        // use a specific mipmap level as diffuse
        // level 6, 2x2

        // set render state

        // set viewport

        // use shader program

        // set textures

        // set uniform params and samplers

        // draw a full screen quad

        
        // delete temp FBO
        fbo.release();
        // delete shader program
        program.release();
    }
}
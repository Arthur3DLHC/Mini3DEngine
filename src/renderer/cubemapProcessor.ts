// shader codes
import cubemap_filter_vs from "./shaders/cubemap_filter_vs.glsl.js";
import cubemap_filter_diffuse_fs from "./shaders/cubemap_filter_diffuse_fs.glsl.js";
import cubemap_filter_specular_fs from "./shaders/cubemap_filter_specular_fs.glsl.js";

// modules
import { Texture2DArray } from "../WebGLResources/textures/texture2DArray";
import { FrameBuffer } from "../WebGLResources/frameBuffer";
import { GLPrograms } from "../WebGLResources/glPrograms.js";
import { ShaderProgram } from "../WebGLResources/shaderProgram.js";
import { RenderStateSet } from "./renderStateSet.js";
import { RenderStateCache } from "../WebGLResources/renderStateCache.js";
import { GLDevice } from "../WebGLResources/glDevice.js";

/**
 * generate specular mipmaps of cubemaps (texture2darray)
 * generate ambient cube or SH from cubemap
 */
export class CubemapProcessor {
    public constructor() {
        // register shader code, if not registered?
        // use which vertex shader?
        if (GLPrograms.shaderCodes["cubemap_filter_vs"] === undefined) {
            GLPrograms.shaderCodes["cubemap_filter_vs"] = cubemap_filter_vs;
        }

        // fragment shader
        if (GLPrograms.shaderCodes["cubemap_filter_diffuse_fs"] === undefined) {
            GLPrograms.shaderCodes["cubemap_filter_diffuse_fs"] = cubemap_filter_diffuse_fs;
        }

        if (GLPrograms.shaderCodes["cubemap_filter_specular_fs"] === undefined) {
            GLPrograms.shaderCodes["cubemap_filter_specular_fs"] = cubemap_filter_specular_fs;
        }

        this._renderStates = new RenderStateSet();
        this._renderStates.blendState = RenderStateCache.instance.getBlendState(false, GLDevice.gl.FUNC_ADD, GLDevice.gl.SRC_ALPHA, GLDevice.gl.ONE_MINUS_SRC_ALPHA);
        this._renderStates.colorWriteState = RenderStateCache.instance.getColorWriteState(true, true, true, true);
        this._renderStates.cullState = RenderStateCache.instance.getCullState(false, GLDevice.gl.BACK);
        this._renderStates.depthState = RenderStateCache.instance.getDepthStencilState(false, false, GLDevice.gl.ALWAYS);
    }

    private _renderStates: RenderStateSet;

    public processSpecular(source: Texture2DArray, dest: Texture2DArray, cubemapCount: number) {
        // create a temp shader program?
        const program = new ShaderProgram();
        program.name = "cubemap_filter_diffuse";
        program.vertexShaderCode = GLPrograms.shaderCodes["cubemap_filter_vs"];
        program.fragmentShaderCode = GLPrograms.shaderCodes["cubemap_filter_specular_fs"];
        program.build();

        // create a temp FBO?
        const frameBuffer = new FrameBuffer();

        // iterate all cubemaps
        for (let ilayer = 0; ilayer < cubemapCount; ilayer++) {
            // use 0 ~ 5 level as specular (64x64 to 4x4)
            // with different roughness
            for (let ilevel = 0; ilevel < 6; ilevel++) {
                // bind texture layer to fbo
                frameBuffer.setTexture(0, dest, ilevel, ilayer);
                frameBuffer.prepare();

                // render target
                GLDevice.renderTarget = frameBuffer;

                // render state
                this._renderStates.apply();

                // viewport
                const size = dest.getLevelSize(ilevel);
                GLDevice.gl.viewport(0, 0, size.x, size.y);

                // use shader program


                // set textures

                // set uniform params and samplers

                // draw a full screen quad
            }
        }

        // delete temp FBO
        frameBuffer.release();
        // delete shader program
        program.release();
    }

    public processDiffuse(source: Texture2DArray, dest: Texture2DArray, cubemapCount: number) {
        // create a temp shader program?
        const program = new ShaderProgram();

        // create a temp FBO?
        const fbo = new FrameBuffer();

        // iterate all cubemaps

        // use a specific mipmap level as diffuse
        // level 6, 2x2？

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
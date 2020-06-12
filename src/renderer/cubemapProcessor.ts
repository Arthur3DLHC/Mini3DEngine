// shader codes
import function_ibl from "./shaders/shaderIncludes/function_ibl.glsl.js";
import cubemap_filter_vs from "./shaders/cubemap_filter_vs.glsl.js";
import cubemap_filter_diffuse_fs from "./shaders/cubemap_filter_diffuse_fs.glsl.js";
import cubemap_filter_specular_LD_fs from "./shaders/cubemap_filter_specular_LD_fs.glsl.js";
import cubemap_filter_specular_DFG_fs from "./shaders/cubemap_filter_specular_DFG_fs.glsl.js";

// modules
import { Texture2DArray } from "../WebGLResources/textures/texture2DArray.js";
import { FrameBuffer } from "../WebGLResources/frameBuffer.js";
import { GLPrograms } from "../WebGLResources/glPrograms.js";
import { ShaderProgram } from "../WebGLResources/shaderProgram.js";
import { RenderStateSet } from "./renderStateSet.js";
import { RenderStateCache } from "../WebGLResources/renderStateCache.js";
import { GLDevice } from "../WebGLResources/glDevice.js";
import { GLTextures } from "../WebGLResources/glTextures.js";
import { PlaneGeometry } from "../geometry/common/planeGeometry.js";
import { Texture2D } from "../WebGLResources/textures/texture2D.js";

/**
 * generate specular mipmaps of cubemaps (texture2darray)
 * generate ambient cube or SH from cubemap
 */
export class CubemapProcessor {
    public constructor() {
        // register shader code, if not registered?
        // use which vertex shader?
        if (GLPrograms.shaderCodes["function_ibl"] === undefined) {
            GLPrograms.shaderCodes["function_ibl"] = function_ibl;
        }

        if (GLPrograms.shaderCodes["cubemap_filter_vs"] === undefined) {
            GLPrograms.shaderCodes["cubemap_filter_vs"] = cubemap_filter_vs;
        }

        // fragment shader
        if (GLPrograms.shaderCodes["cubemap_filter_diffuse_fs"] === undefined) {
            GLPrograms.shaderCodes["cubemap_filter_diffuse_fs"] = cubemap_filter_diffuse_fs;
        }

        if (GLPrograms.shaderCodes["cubemap_filter_specular_LD_fs"] === undefined) {
            GLPrograms.shaderCodes["cubemap_filter_specular_LD_fs"] = cubemap_filter_specular_LD_fs;
        }

        if (GLPrograms.shaderCodes["cubemap_filter_specular_DFG_fs"] === undefined) {
            GLPrograms.shaderCodes["cubemap_filter_specular_DFG_fs"] = cubemap_filter_specular_DFG_fs;
        }

        this._renderStates = new RenderStateSet();
        this._renderStates.blendState = RenderStateCache.instance.getBlendState(false, GLDevice.gl.FUNC_ADD, GLDevice.gl.SRC_ALPHA, GLDevice.gl.ONE_MINUS_SRC_ALPHA);
        this._renderStates.colorWriteState = RenderStateCache.instance.getColorWriteState(true, true, true, true);
        this._renderStates.cullState = RenderStateCache.instance.getCullState(false, GLDevice.gl.BACK);
        this._renderStates.depthState = RenderStateCache.instance.getDepthStencilState(false, false, GLDevice.gl.ALWAYS);

        this._rectGeom = new PlaneGeometry(2, 2, 1, 1);
        // this._rectTransform = new mat4();
    }

    public release() {
        this._rectGeom.destroy();
    }

    private _renderStates: RenderStateSet;
    private _rectGeom: PlaneGeometry;
    // private _rectTransform: mat4;

    public static readonly maxSpecularMipLevel = 4;
    public static readonly diffuseMipLevel = 5;

    public processSpecularLD(source: Texture2DArray, dest: Texture2DArray, cubemapCount: number, textureUnit: number) {
        // create a temp shader program
        const program = new ShaderProgram();
        program.name = "cubemap_filter_specular_LD";
        program.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["cubemap_filter_vs"]);
        program.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["cubemap_filter_specular_LD_fs"]);
        program.build();

        // use shader program
        GLPrograms.useProgram(program);

        // create a temp FBO?
        const frameBuffer = new FrameBuffer();

        // iterate all cubemaps
        for (let ilayer = 0; ilayer < cubemapCount; ilayer++) {
            // use 0 ~ 4 level as specular (64x64 to 8x8)
            // with different roughness
            for (let ilevel = 0; ilevel <= CubemapProcessor.maxSpecularMipLevel; ilevel++) {
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
                GLDevice.gl.scissor(0, 0, size.x, size.y);

                // set textures. because framebuffer.prepare will bind texture,
                // need set textures here.
                GLTextures.setTextureAt(textureUnit, source, GLDevice.gl.TEXTURE_2D_ARRAY);

                // set uniform params and samplers
                const sourceTexLocation = program.getUniformLocation("s_source");
                GLDevice.gl.uniform1i(sourceTexLocation, textureUnit);

                const roughness = ilevel / CubemapProcessor.maxSpecularMipLevel;
                const roughnessLocation = program.getUniformLocation("u_roughness");
                GLDevice.gl.uniform1f(roughnessLocation, roughness);

                // source texture layer index
                const layerLocation = program.getUniformLocation("u_layer");
                GLDevice.gl.uniform1i(layerLocation, ilayer);

                // draw a full screen quad
                this._rectGeom.draw(0, Infinity, program.attributes);
            }
        }

        GLTextures.setTextureAt(textureUnit, null, GLDevice.gl.TEXTURE_2D_ARRAY);

        // delete temp FBO
        frameBuffer.release();
        // delete shader program
        program.release();
    }

    public processSpecularDFG(dest: Texture2D) {
        // todo: generate DFG lut texture
        // need to add a texture in renderer.
        const program = new ShaderProgram();
        program.name = "cubemap_filter_specular_DFG";
        program.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["cubemap_filter_vs"]);
        program.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["cubemap_filter_specular_DFG_fs"]);
        program.build();

        GLPrograms.useProgram(program);

        const frameBuffer = new FrameBuffer();
        frameBuffer.setTexture(0, dest);
        frameBuffer.prepare();

        GLDevice.renderTarget = frameBuffer;
        // render one rect
        const size = dest.getLevelSize(0);
        GLDevice.gl.viewport(0, 0, size.x, size.y);
        GLDevice.gl.scissor(0, 0, size.x, size.y);

        this._rectGeom.draw(0, Infinity, program.attributes);

        frameBuffer.release();
        program.release();
    }

    public processDiffuse(source: Texture2DArray, dest: Texture2DArray, cubemapCount: number, textureUnit: number) {
        // create a temp shader program?
        const program = new ShaderProgram();
        program.name = "cubemap_filter_diffuse";
        program.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["cubemap_filter_vs"]);
        program.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["cubemap_filter_specular_LD_fs"]);
        program.build();

        // use shader program
        GLPrograms.useProgram(program);

        // create a temp FBO?
        const frameBuffer = new FrameBuffer();

        // iterate all cubemaps
        for (let ilayer = 0; ilayer < cubemapCount; ilayer++) {
            // use a specific mipmap level as diffuse
            // level 5, 4x4？
            frameBuffer.setTexture(0, dest, CubemapProcessor.diffuseMipLevel, ilayer);
            frameBuffer.prepare();

            GLDevice.renderTarget = frameBuffer;

            // set render state
            this._renderStates.apply();

            // set viewport
            const size = dest.getLevelSize(CubemapProcessor.diffuseMipLevel);
            GLDevice.gl.viewport(0, 0, size.x, size.y);
            GLDevice.gl.scissor(0, 0, size.x, size.y);

            // set textures
            GLTextures.setTextureAt(textureUnit, source, GLDevice.gl.TEXTURE_2D_ARRAY);

            // set uniform params and samplers
            const sourceTexLocation = program.getUniformLocation("s_source");
            GLDevice.gl.uniform1i(sourceTexLocation, textureUnit);

            // source texture layer index
            const layerLocation = program.getUniformLocation("u_layer");
            GLDevice.gl.uniform1i(layerLocation, ilayer);

            // draw a full screen quad
            this._rectGeom.draw(0, Infinity, program.attributes);
        }

        GLTextures.setTextureAt(textureUnit, null, GLDevice.gl.TEXTURE_2D_ARRAY);
        
        // delete temp FBO
        frameBuffer.release();
        // delete shader program
        program.release();
    }
}
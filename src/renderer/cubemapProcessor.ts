// shader codes
import cubemap_filter_vs from "./shaders/cubemap_filter_vs.glsl.js";
import cubemap_filter_diffuse_fs from "./shaders/cubemap_filter_diffuse_fs.glsl.js";
import cubemap_filter_specular_fs from "./shaders/cubemap_filter_specular_fs.glsl.js";

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

        this._rectGeom = new PlaneGeometry(2, 2, 1, 1);
        // this._rectTransform = new mat4();
    }

    public release() {
        this._rectGeom.destroy();
    }

    private _renderStates: RenderStateSet;
    private _rectGeom: PlaneGeometry;
    // private _rectTransform: mat4;

    private static readonly _maxSpecularMipLevel = 4;
    private static readonly _diffuseMipLevel = 5;

    public processSpecular(source: Texture2DArray, dest: Texture2DArray, cubemapCount: number, textureUnit: number) {
        // create a temp shader program?
        const program = new ShaderProgram();
        program.name = "cubemap_filter_specular";
        program.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["cubemap_filter_vs"]);
        program.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["cubemap_filter_specular_fs"]);
        program.build();

        // use shader program
        GLPrograms.useProgram(program);

        // create a temp FBO?
        const frameBuffer = new FrameBuffer();

        // iterate all cubemaps
        for (let ilayer = 0; ilayer < cubemapCount; ilayer++) {
            // use 0 ~ 4 level as specular (64x64 to 8x8)
            // with different roughness
            for (let ilevel = 0; ilevel <= CubemapProcessor._maxSpecularMipLevel; ilevel++) {
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

                const roughness = ilevel / CubemapProcessor._maxSpecularMipLevel;
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

    public processDiffuse(source: Texture2DArray, dest: Texture2DArray, cubemapCount: number, textureUnit: number) {
        // create a temp shader program?
        const program = new ShaderProgram();
        program.name = "cubemap_filter_diffuse";
        program.vertexShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["cubemap_filter_vs"]);
        program.fragmentShaderCode = GLPrograms.processSourceCode(GLPrograms.shaderCodes["cubemap_filter_specular_fs"]);
        program.build();

        // use shader program
        GLPrograms.useProgram(program);

        // create a temp FBO?
        const frameBuffer = new FrameBuffer();

        // iterate all cubemaps
        for (let ilayer = 0; ilayer < cubemapCount; ilayer++) {
            // use a specific mipmap level as diffuse
            // level 5, 4x4？
            frameBuffer.setTexture(0, dest, CubemapProcessor._diffuseMipLevel, ilayer);
            frameBuffer.prepare();

            GLDevice.renderTarget = frameBuffer;

            // set render state
            this._renderStates.apply();

            // set viewport
            const size = dest.getLevelSize(CubemapProcessor._diffuseMipLevel);
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
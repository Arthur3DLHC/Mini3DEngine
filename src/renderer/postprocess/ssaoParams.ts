import { Texture2D } from "../../WebGLResources/textures/texture2D.js";
import { GLDevice } from "../../WebGLResources/glDevice.js";
import { SamplerState } from "../../WebGLResources/renderStates/samplerState.js";
import vec3 from "../../../lib/tsm/vec3.js";

export class SSAOParams {
    public constructor() {
        this.noiseTexture = new Texture2D();
        this.noiseTexture.width = 4;
        this.noiseTexture.height = 4;
        this.noiseTexture.depth = 1;
        this.noiseTexture.mipLevels = 1;
        this.noiseTexture.componentType = GLDevice.gl.FLOAT;
        this.noiseTexture.format = GLDevice.gl.RGB;
        this.noiseTexture.samplerState = new SamplerState(GLDevice.gl.REPEAT, GLDevice.gl.REPEAT, GLDevice.gl.LINEAR, GLDevice.gl.LINEAR);

        this.noiseTexture.create();
        const numPixels = this.noiseTexture.width * this.noiseTexture.height;
        const data = new Float32Array(numPixels * 3);
        // todo: try and compare different methods to generate noise texture:
        // plain random number
        for(let i = 0; i < numPixels * 3; i++) {
            data[i] = Math.random() * 2.0 - 1.0;
        }
        // simplex noise
        // blue noise?
        // rotation disk (sin and cos values)

        this.noiseTexture.image = data;

        this.noiseTexture.upload();

        this.kernels = new Float32Array(SSAOParams.numKernels * 3);

        this.generateSSAOKernels();
    }
    public static readonly numKernels = 32;
    public noiseTexture: Texture2D;
    public kernels: Float32Array;

    public enable: boolean = true;
    public radius: number = 8;              // meters
    public minDistance: number = 0.005;     // -1, 1 range
    public maxDistance: number = 0.1;       // -1, 1 range
    public blurSize: number = 1.0;          // px
    public intensiy: number = 1.0;
    public power: number = 2.0;

    private generateSSAOKernels() {
        // use random vectors in a hemisphere
        // use halton sequence?

        // https://github.com/pissang/claygl-advanced-renderer/blob/master/src/SSAOPass.js
        // NOTE: in that code they use temporal filter for SSAO, so they generate 30 kernel arrays for 30 frames.

        const offset = 0;
        let sample = new vec3();

        for(let i = 0; i < SSAOParams.numKernels; i++) {
            // let phi = Halton.get(i + offset, 2) * Math.PI;      // hemisphere
            // let theta = Halton.get(i + offset, 3) * 

            // test: use plain random values, same as three.js
            // hemisphere
            sample.x = Math.random() * 2 - 1;
            sample.y = Math.random() * 2 - 1;
            sample.z = Math.random();

            sample.normalize();

            // vary length
            let scale = i / SSAOParams.numKernels;
            scale *= scale;
            scale = 0.1 + 0.9 * scale;      // lerp(0.1, 1, scale)
            sample.scale(scale);

            this.kernels[i * 3] = sample.x;
            this.kernels[i * 3 + 1] = sample.y;
            this.kernels[i * 3 + 2] = sample.z;
        }
    }
}
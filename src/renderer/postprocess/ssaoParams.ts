import { Texture2D } from "../../WebGLResources/textures/texture2D.js";
import { GLDevice } from "../../WebGLResources/glDevice.js";
import { SamplerState } from "../../WebGLResources/renderStates/samplerState.js";
import vec3 from "../../../lib/tsm/vec3.js";
import { Halton } from "../../math/halton.js";
import { Hammersley } from "../../math/Hammersley.js";

export class SSAOParams {
    public constructor() {
        this.noiseTexture = new Texture2D(4, 4, 1, 1, GLDevice.gl.RGB, GLDevice.gl.FLOAT);
        this.noiseTexture.samplerState = new SamplerState(GLDevice.gl.REPEAT, GLDevice.gl.REPEAT, GLDevice.gl.LINEAR, GLDevice.gl.LINEAR);

        this.noiseTexture.create();
        const numPixels = this.noiseTexture.width * this.noiseTexture.height;
        const data = new Float32Array(numPixels * 3);
        // todo: try and compare different methods to generate noise texture:
        // plain random number
        //for(let i = 0; i < numPixels * 3; i++) {
        //    data[i] = Math.random() * 2.0 - 1.0;
        //}

        // hammersley
        /*
        for(let i = 0; i < numPixels; i++) {
            // base 必须使用质数
            data[i * 3 + 0] = Hammersley.get(0, i, 2, numPixels) * 2.0 - 1.0;
            data[i * 3 + 1] = Hammersley.get(1, i, 3, numPixels) * 2.0 - 1.0;
            data[i * 3 + 2] = Hammersley.get(2, i, 5, numPixels) * 2.0 - 1.0;
        }
        */
        
        // simplex noise
        // blue noise?

        // rotation disk (sin and cos values)
        for(let i = 0; i < numPixels; i++) {
            const angle = i * 2.0 * Math.PI / numPixels;
            data[i * 3 + 0] = Math.sin(angle);
            data[i * 3 + 1] = Math.cos(angle);
            data[i * 3 + 2] = 0;        // rotate along z axis, so z is zero
        }

        console.info("SSAO noise:" + data);

        this.noiseTexture.image = data;

        this.noiseTexture.upload();

        this.kernels = new Float32Array(SSAOParams.numKernels * 3);

        this.generateKernels();
    }
    public static readonly numKernels = 32;
    public noiseTexture: Texture2D;
    public kernels: Float32Array;

    public enable: boolean = true;
    public radius: number = 0.4;              // meters
    public minDistance: number = 0.001;     // -1, 1 range
    public maxDistance: number = 0.01;       // -1, 1 range
    public blurSize: number = 1.0;          // px
    public intensiy: number = 1.0;
    public power: number = 1.0;

    private generateKernels() {
        // use random vectors in a hemisphere
        // use halton sequence?

        // https://github.com/pissang/claygl-advanced-renderer/blob/master/src/SSAOPass.js
        // NOTE: in that code they use temporal filter for SSAO, so they generate 30 kernel arrays for 30 frames.

        const offset = 0;
        let sample = new vec3();

        for(let i = 0; i < SSAOParams.numKernels; i++) {
            // test: use halton sequence
            let phi = Halton.get(i + offset, 2) * Math.PI;          // hemisphere, pitch
            let theta = Halton.get(i + offset, 3) * Math.PI * 2;        // yaw

            sample.z = Math.sin(phi);
            sample.x = Math.cos(phi) * Math.cos(theta);
            sample.y = Math.cos(phi) * Math.sin(theta);

            // test: use plain random values, same as three.js
            // hemisphere
            // sample.x = Math.random() * 2.0 - 1.0;
            // sample.y = Math.random() * 2.0 - 1.0;
            // sample.z = Math.random();

            // sample.normalize();

            // vary length
            let scale = (i + 1) / SSAOParams.numKernels;
            // scale *= scale;
            // scale = 0.1 + 0.9 * scale;      // lerp(0.1, 1, scale)
            sample.scale(scale);

            this.kernels[i * 3] = sample.x;
            this.kernels[i * 3 + 1] = sample.y;
            this.kernels[i * 3 + 2] = sample.z;
        }

        console.info("SSAO Kernels:" + this.kernels);
    }
}
import { GLDevice } from "../glDevice";

export class SamplerState {
    public constructor(wrapS: GLenum = GLDevice.gl.REPEAT, wrapT: GLenum = GLDevice.gl.REPEAT, minFilter = GLDevice.gl.LINEAR, magfilter = GLDevice.gl.LINEAR, anisotropy = 1) {
        this.wrapS = wrapS;
        this.wrapT = wrapT;
        this.minFilter = minFilter;
        this.magFilter = magfilter;
        this.anisotropy = anisotropy;
        this._glSampler = null;
    }

    public wrapS: GLenum;
    public wrapT: GLenum;
    public minFilter: GLenum;
    public magFilter: GLenum;
    public anisotropy: number;

    /**
     * we can create sampler state objects and bind them in WebGL 2.0
     */
    private _glSampler: WebGLSampler|null;
}
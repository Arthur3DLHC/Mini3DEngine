import { Camera } from "../scene/cameras/camera.js";
import { BaseLight } from "../scene/lights/baseLight.js";
import { Decal } from "../scene/decal.js";
import { EnvironmentProbe } from "../scene/environmentProbe.js";
import { TextureCube } from "../WebGLResources/textures/textureCube.js";

/**
 * current rendering context, including cameras, visible lights, decals, cubemaps...
 * things that will influence renderable objects
 */
export class RenderContext {
    public constructor() {
        this.cameras = [];
        // this.skybox = null;
        this.staticLights = [];
        this.staticDecals = [];
        this.dynamicLights = [];
        this.dynamicDecals = [];
        this.envProbes = [];
        this.irradianceProbes = [];

        this._curCameraIndex = 0;
        this._curStaticLightIndex = 0;
        this._curStaticDecalIndex = 0;
        this._curDynamicLightIndex = 0;
        this._curDynamicDecalIndex = 0;
        this._curEnvMapIndex = 0;
        this._curIrradianceProbeIndex = 0;
    }
    public cameras: Camera[];
    // public skybox: TextureCube | null;
    public staticLights: BaseLight[];
    public staticDecals: Decal[];
    public dynamicLights: BaseLight[];
    public dynamicDecals: Decal[];
    public envProbes: EnvironmentProbe[];
    public irradianceProbes: EnvironmentProbe[];

    public get staticLightCount() { return this._curStaticLightIndex; }
    public get dynamicLightCount() { return this._curDynamicLightIndex; }
    public get staticDecalCount() { return this._curStaticDecalIndex; }
    public get dynamicDecalCount() { return this._curDynamicDecalIndex; }
    public get envprobeCount() { return this._curEnvMapIndex; }
    public get irradianceProbeCount() { return this._curIrradianceProbeIndex; }
    public get cameraCount() { return this._curCameraIndex; }

    public clear(statics: boolean, dynamics: boolean) {
        this._curCameraIndex = 0;
        // this.skybox = null;
        if (statics) {
            this._curStaticLightIndex = 0;
            this._curStaticDecalIndex = 0;
            this._curEnvMapIndex = 0;
            this._curIrradianceProbeIndex = 0;
        }
        if (dynamics) {
            this._curDynamicLightIndex = 0;
            this._curDynamicDecalIndex = 0;
        }
    }

    public addCamera(camera: Camera) {
        this.cameras[this._curCameraIndex] = camera;
        this._curCameraIndex++;
    }

    public addLight(light: BaseLight) {
        if (light.isStatic) {
            this.staticLights[this._curStaticLightIndex] = light;
            this._curStaticLightIndex++;
        } else {
            this.dynamicLights[this._curDynamicLightIndex] = light;
            this._curDynamicLightIndex++;     
        }
    }

    public addDecal(decal: Decal) {
        if (decal.isStatic) {
            this.staticDecals[this._curStaticDecalIndex] = decal;
            this._curStaticDecalIndex++;
        } else {
            this.dynamicDecals[this._curDynamicDecalIndex] = decal;
            this._curDynamicDecalIndex++;
        }
    }

    public addEnvironmentProbe(envProbe: EnvironmentProbe) {
        this.envProbes[this._curEnvMapIndex] = envProbe;
        this._curEnvMapIndex++;
    }

    public addIrradianceProbe(irrVol: EnvironmentProbe) {
        this.irradianceProbes[this._curIrradianceProbeIndex] = irrVol;
        this._curIrradianceProbeIndex++;
    }

    private _curCameraIndex: number;
    private _curStaticLightIndex: number;
    private _curStaticDecalIndex: number;
    private _curDynamicLightIndex: number;
    private _curDynamicDecalIndex: number;
    private _curEnvMapIndex: number;
    private _curIrradianceProbeIndex: number;
}
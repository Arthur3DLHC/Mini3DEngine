import { Camera } from "../scene/cameras/camera.js";
import { BaseLight } from "../scene/lights/baseLight.js";
import { Decal } from "../scene/decal.js";
import { IrradianceVolume } from "../scene/irradianceVolume.js";
import { EnvironmentProbe } from "../scene/environmentProbe.js";

/**
 * current rendering context, including cameras, visible lights, decals, cubemaps...
 */
export class RenderContext {
    public constructor() {
        this.cameras = [];
        this.staticLights = [];
        this.staticDecals = [];
        this.dynamicLights = [];
        this.dynamicDecals = [];
        this.envProbes = [];
        this.irradianceVolumes = [];

        this.curCameraIndex = 0;
        this.curStaticLightIndex = 0;
        this.curStaticDecalIndex = 0;
        this.curDynamicLightIndex = 0;
        this.curDynamicDecalIndex = 0;
        this.curEnvMapIndex = 0;
        this.curIrradianceVolumeIndex = 0;
    }
    public cameras: Camera[];
    public staticLights: BaseLight[];
    public staticDecals: Decal[];
    public dynamicLights: BaseLight[];
    public dynamicDecals: Decal[];
    public envProbes: EnvironmentProbe[];
    public irradianceVolumes: IrradianceVolume[];

    public clear(statics: boolean, dynamics: boolean) {
        this.curCameraIndex = 0;
        if (statics) {
            this.curStaticLightIndex = 0;
            this.curStaticDecalIndex = 0;
            this.curEnvMapIndex = 0;
            this.curIrradianceVolumeIndex = 0;
        }
        if (dynamics) {
            this.curDynamicLightIndex = 0;
            this.curDynamicDecalIndex = 0;
        }
    }

    public addCamera(camera: Camera) {
        this.cameras[this.curCameraIndex] = camera;
        this.curCameraIndex++;
    }

    public addLight(light: BaseLight) {
        if (light.isStatic) {
            this.staticLights[this.curStaticLightIndex] = light;
            this.curStaticLightIndex++;
        } else {
            this.dynamicLights[this.curDynamicLightIndex] = light;
            this.curDynamicLightIndex++;     
        }
    }

    public addDecal(decal: Decal) {
        if (decal.isStatic) {
            this.staticDecals[this.curStaticDecalIndex] = decal;
            this.curStaticDecalIndex++;
        } else {
            this.dynamicDecals[this.curDynamicDecalIndex] = decal;
            this.curDynamicDecalIndex++;
        }
    }

    public addEnvironmentProbe(envProbe: EnvironmentProbe) {
        this.envProbes[this.curEnvMapIndex] = envProbe;
        this.curEnvMapIndex++;
    }

    public addIrradianceVolume(irrVol: IrradianceVolume) {
        this.irradianceVolumes[this.curIrradianceVolumeIndex] = irrVol;
        this.curIrradianceVolumeIndex++;
    }

    private curCameraIndex: number;
    private curStaticLightIndex: number;
    private curStaticDecalIndex: number;
    private curDynamicLightIndex: number;
    private curDynamicDecalIndex: number;
    private curEnvMapIndex: number;
    private curIrradianceVolumeIndex: number;
}
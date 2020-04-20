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
        this.lights = [];
        this.decals = [];
        this.envProbes = [];
        this.irradianceVolumes = [];

        this.curCameraIndex = 0;
        this.curLightIndex = 0;
        this.curDecalIndex = 0;
        this.curEnvMapIndex = 0;
        this.curIrradianceVolumeIndex = 0;
    }
    public cameras: Camera[];
    public lights: BaseLight[];
    public decals: Decal[];
    public envProbes: EnvironmentProbe[];
    public irradianceVolumes: IrradianceVolume[];

    public clear() {
        this.curCameraIndex = 0;
        this.curLightIndex = 0;
        this.curDecalIndex = 0;
        this.curEnvMapIndex = 0;
        this.curIrradianceVolumeIndex = 0;
    }

    public addCamera(camera: Camera) {
        this.cameras[this.curCameraIndex] = camera;
        this.curCameraIndex++;
    }

    public addLight(light: BaseLight) {
        this.lights[this.curLightIndex] = light;
        this.curLightIndex++;
    }

    public addDecal(decal: Decal) {
        this.decals[this.curDecalIndex] = decal;
        this.curDecalIndex++;
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
    private curLightIndex: number;
    private curDecalIndex: number;
    private curEnvMapIndex: number;
    private curIrradianceVolumeIndex: number;
}
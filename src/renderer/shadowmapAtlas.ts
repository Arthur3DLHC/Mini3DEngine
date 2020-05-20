import { LightShadow } from "../scene/lights/lightShadow";

/**
 * alloc and free shadowmap atlas rectangles
 * for simplicity now, only use several fixed shadowmap sizes, such as
 * 64, 128, 256, 512
 * use a 4096 x 4096 atlas
 * 
 */
export class ShadowmapAtlas {
    public constructor() {
        this._shadowmaps512 = [];
        this._shadowmaps256 = [];
        this._shadowmaps128 = [];
        this._shadowmaps64 = [];

        // todo: calculate this counts
        this._maxMaps512 = 16;
        this._maxMaps256 = 32;
        this._maxMaps128 = 64;
        this._maxMaps64 = 128;
    }

    private _shadowmaps512: LightShadow[];
    private _shadowmaps256: LightShadow[];
    private _shadowmaps128: LightShadow[];
    private _shadowmaps64: LightShadow[];

    private _maxMaps512: number;
    private _maxMaps256: number;
    private _maxMaps128: number;
    private _maxMaps64: number;

    public collectUnused() {
        // iterate all? and remove shadowmaps not marked as used?
        // record a framenumber property for all shadowmaps?
        // or add an allocated - destroyed flag on lightshadow object
        // when the light is destroyed, set that flag
        // then here, check that flag and collect unused?
    }
}
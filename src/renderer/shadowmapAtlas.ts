import { LightShadow } from "../scene/lights/lightShadow";
import { Texture2D } from "../WebGLResources/textures/texture2D";

/**
 * alloc and free shadowmap atlas rectangles
 * for simplicity now, only use several fixed shadowmap sizes, such as
 * 64, 128, 256, 512
 * use a 4096 x 4096 atlas
 * 
 */
export class ShadowmapAtlas {
    public constructor() {
        this.texture = null;

        this._shadowmaps512 = [];
        this._shadowmaps256 = [];
        this._shadowmaps128 = [];
        this._shadowmaps64 = [];

        // todo: calculate default counts
        //                 columns x rows
        this.maxMaps512 = 8  *  2;
        this.maxMaps256 = 16 *  4;
        this.maxMaps128 = 32 *  8;
        this.maxMaps64 =  64 *  16;
    }

    public texture: Texture2D | null;

    private _shadowmaps512: LightShadow[];
    private _shadowmaps256: LightShadow[];
    private _shadowmaps128: LightShadow[];
    private _shadowmaps64: LightShadow[];

    public maxMaps512: number;
    public maxMaps256: number;
    public maxMaps128: number;
    public maxMaps64: number;

    public alloc(shadow: LightShadow) {
        if (shadow.mapRect.z === 512 && shadow.mapRect.w === 512) {
            this.allocInList(this._shadowmaps512, this.maxMaps512, shadow, 0);
        } else if (shadow.mapRect.z === 256 && shadow.mapRect.w === 256) {
            this.allocInList(this._shadowmaps256, this.maxMaps256, shadow, 1024);
        } else if (shadow.mapRect.z === 128 && shadow.mapRect.w === 128) {
            this.allocInList(this._shadowmaps128, this.maxMaps128, shadow, 2048);
        } else if (shadow.mapRect.z === 64 && shadow.mapRect.w === 64) {
            this.allocInList(this._shadowmaps64, this.maxMaps64, shadow, 3072);
        } else {
            throw new Error("unsupport shadowmap size: " + shadow.mapRect.z + " x " + shadow.mapRect.w);
        }
    }

    private allocInList(shadowmapList: LightShadow[], maxCount: number, shadow: LightShadow, startY: number) {
        for (let i = 0; i < shadowmapList.length; i++) {
            const shadowmap = shadowmapList[i];
            if (shadowmap === null) {
                shadowmapList[i] = shadow;
                shadow.shadowMap = this.texture;
                this.calcLocation(shadow, i, startY);
                return;
            } else if (shadowmap.shadowMap === null) {
                // if light destroyed, it will set its shadowmap to null
                shadowmapList[i] = shadow;
                shadow.shadowMap = this.texture;
                this.calcLocation(shadow, i, startY);
                return;
            }
        }
        // no unused locations found, alloc new one
        // todo: calc locaiton rectangle
        if (shadowmapList.length >= maxCount) {
            throw new Error("too much shadowmaps with size:" + shadow.mapRect.z);
        }
        shadowmapList.push(shadow);
        shadow.shadowMap = this.texture;
        this.calcLocation(shadow, shadowmapList.length - 1, startY);
    }

    private calcLocation(shadow: LightShadow, i: number, startY: number) {
        if (this.texture) {
            const w = shadow.mapRect.z;
            const h = shadow.mapRect.w;
            const maxCol = this.texture.width / w;
            const row = Math.floor(i / maxCol);
            const col = i - row * maxCol;
            shadow.mapRect.x = col * w;
            shadow.mapRect.y = row * h + startY;
        } else {
            throw new Error("shadowmap texture not set.");
        }
    }

    // public collectUnused() {
    //     // iterate all? and remove shadowmaps not marked as used?
    //     // record a framenumber property for all shadowmaps?
    //     // or add an allocated - destroyed flag on lightshadow object
    //     // when the light is destroyed, set that flag
    //     // then here, check that flag and collect unused?
    //     // remove and pack the list tight?
    // }
}
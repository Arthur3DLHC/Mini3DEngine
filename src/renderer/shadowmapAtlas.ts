import { LightShadow } from "../scene/lights/lightShadow.js";
import { Texture2D } from "../WebGLResources/textures/texture2D.js";
import { PointLightShadow } from "../scene/lights/pointLightShadow.js";

class shadowMapList {
    public constructor(maxCount: number, startY: number) {
        this.maxCount = maxCount;
        this.startY = startY;
    }
    public shadows: (LightShadow | null)[] = [];
    public maxCount: number;
    public startY: number;

    public alloc(shadow: LightShadow, texture: Texture2D) {
        if (shadow instanceof PointLightShadow) {
            // check if there are continue 6 ?
            // or can add 6 faces saparated ?
            // pay attention to removing;
            for(let iface = 0; iface < 6; iface++) {
                this.allocSingleFace(shadow, iface, texture);
            }

        } else {
            this.allocSingleFace(shadow, 0, texture);
        }
    }

    release(shadow: LightShadow) {
        for (let i = 0; i < this.shadows.length; i++) {
            const element = this.shadows[i];
            if (element === shadow) {
                shadow.shadowMap = null;    // mark the list as unused
                this.shadows[i] = null;
                // do not break because point lights may take 6 elements in list.
            }
        }
    }

    private calcLocation(shadow: LightShadow, iAtlas: number, iFace: number, texture: Texture2D) {
            const width = shadow.mapSize.x;
            const height = shadow.mapSize.y;
            const maxCol = texture.width / width;
            const row = Math.floor(iAtlas / maxCol);
            const col = iAtlas - row * maxCol;
            const mapRect = shadow.mapRects[iFace];
            mapRect.x = col * width;
            mapRect.y = row * height + this.startY;
            mapRect.z = width;
            mapRect.w = height;
    }

    private allocSingleFace(shadow: LightShadow, iface: number, texture: Texture2D) {
        for (let i = 0; i < this.shadows.length; i++) {
            const shadowmap = this.shadows[i];
            if (shadowmap === null || shadowmap.shadowMap === null) {
                this.shadows[i] = shadow;
                shadow.shadowMap = texture;
                this.calcLocation(shadow, i, iface, texture);
                return;
            }
        }
        // no unused locations found, alloc new one
        // todo: calc locaiton rectangle
        if (this.shadows.length >= this.maxCount) {
            throw new Error("too much shadowmaps with size:" + shadow.mapSize.x);
        }
        this.shadows.push(shadow);
        shadow.shadowMap = texture;
        this.calcLocation(shadow, this.shadows.length - 1, iface, texture);
    }
}

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

        // todo: calculate default counts
        //                 columns x rows
        this._shadowmaps512 = new shadowMapList(8 * 2, 0);
        this._shadowmaps256 = new shadowMapList(16 * 4, 1024);
        this._shadowmaps128 = new shadowMapList(32 * 8, 2048);
        this._shadowmaps64 = new shadowMapList(64 * 16, 3072);
    }

    public texture: Texture2D | null;

    private _shadowmaps512: shadowMapList;
    private _shadowmaps256: shadowMapList;
    private _shadowmaps128: shadowMapList;
    private _shadowmaps64: shadowMapList;

    public alloc(shadow: LightShadow) {
        if (!this.texture) {
            throw new Error("shadowmap atlas texture not set yet.");
            
        }
        // todo: if already allocated...
        // remove it from list firstly
        if (shadow.shadowMap !== null) {
            if (shadow.mapSizeChanged) {
                const oldList = this.getListBySize(shadow.mapRects[0].z, shadow.mapRects[0].w);
                oldList.release(shadow);
            }
        }

        const list = this.getListBySize(shadow.mapSize.x, shadow.mapSize.y);
        list.alloc(shadow, this.texture);
    }

    private getListBySize(width: number, height: number): shadowMapList {
        if (width === 512 && height === 512) {
            return this._shadowmaps512;
        } else if (width === 256 && height === 256) {
            return this._shadowmaps256;
        } else if (width === 128 && height === 128) {
            return this._shadowmaps128;
        } else if (width === 64 && height === 64) {
            return this._shadowmaps64;
        } else {
            throw new Error("unsupport shadowmap size: " + width + " x " + height);
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
import vec2 from "../../../lib/tsm/vec2.js";
import vec4 from "../../../lib/tsm/vec4.js";

export enum SilhouetteSelectMode {
    All = 0,
    ByTag,
    ByCursor
}

export class SilhouetteParams {
    public constructor() {
        for (let i = 0; i < SilhouetteParams.maxSilhouetteColors * 4; i++) {
            this._silhouetteColors.push(0);
        }
    }
    public enable: boolean = false;
    // public silhouetteColors: vec4[] = [];
    public selectMode: SilhouetteSelectMode = SilhouetteSelectMode.ByTag;
    public tagRef: number = -1;
    public cursor: vec2 = new vec2([0.5, 0.5]);
    public width: number = 1;
    public maxDistance: number = 100;

    public static readonly maxSilhouetteColors = 32;

    public setSilhouetteColor(tag: number, color: vec4) {
        // check tag exceed maxSilhouetteColors?
        const offset = tag * 4;
        this._silhouetteColors[offset + 0] = color.x;
        this._silhouetteColors[offset + 1] = color.y;
        this._silhouetteColors[offset + 2] = color.z;
        this._silhouetteColors[offset + 3] = color.w;
    }

    public getSilhouetteColor(tag: number, color: vec4) {
        // check tag exceed maxSilhouetteColors?
        const offset = tag * 4;
        color.x = this._silhouetteColors[offset + 0];
        color.y = this._silhouetteColors[offset + 1];
        color.z = this._silhouetteColors[offset + 2];
        color.w = this._silhouetteColors[offset + 3];
    }

    /** internal use only */
    public _silhouetteColors: number[] = [];
}
import vec2 from "../../../lib/tsm/vec2.js";
import vec4 from "../../../lib/tsm/vec4.js";

export enum SilhouetteSelectMode {
    All = 0,
    ByTag,
    ByCursor
}

export class SilhouetteParams {
    public enable: boolean = false;
    public silhouetteColors: vec4[] = [];
    public static readonly maxSilhouetteColors = 32;
    public selectMode: SilhouetteSelectMode = SilhouetteSelectMode.ByTag;
    public tagRef: number = -1;
    public cursor: vec2 = new vec2([0.5, 0.5]);
}
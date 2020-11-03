import vec3 from "../../../lib/tsm/vec3.js";

/**
 * exponential height fog params
 */
export class FogParams {
    public constructor() {
        this.enable = false;
        this.density = 1;
        this.color = vec3.one.copy()
        // this.halfSpace = false;
        this.height = 0;
        this.heightFalloff = 1;
        this.startDistance = 0;
        this.endDistance = 1000;
    }

    public enable: boolean;
    /**
     * the global density of fog
     */
    public density: number;
    /**
     * the fog color
     */
    public color: vec3;
    // public halfSpace: boolean;
    /**
     * the height of the top of the fog
     */
    public height: number;
    /**
     * height falloff factor
     */
    public heightFalloff: number;
    /**
     * the dist the fog start to appear
     */
    public startDistance: number;

    /**
     * the dist the fog end. objects further will not be covered by fog
     */
    public endDistance: number;
}
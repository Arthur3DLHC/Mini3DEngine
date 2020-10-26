import vec3 from "../../../lib/tsm/vec3.js";

export class FogParams {
    public constructor() {
        this.enable = false;
        this.density = 0.001;
        this.color = vec3.one.copy()
        this.halfSpace = false;
        this.height = 0;
    }

    public enable: boolean;
    public density: number;
    public color: vec3;
    public halfSpace: boolean;
    public height: number;
}
export class FogParams {
    public constructor() {
        this.enable = false;
        this.density = 0.001;
        this.halfSpace = false;
        this.height = 0;
    }

    public enable: boolean;
    public density: number;
    public halfSpace: boolean;
    public height: number;
}